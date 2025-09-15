import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper function to validate admin JWT token from Authorization header
async function validateAdminToken(authHeader: string | null): Promise<boolean> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  console.log('Received token for validation:', token);
  
  try {
    // Parse the token if it's a JSON string
    let tokenData;
    try {
      tokenData = JSON.parse(token);
    } catch {
      // If it's not JSON, try to validate as-is
      const { data: isValid, error } = await supabase
        .rpc('validate_admin_jwt', { p_token: token });
      
      if (error) {
        console.error('Token validation error:', error);
        return false;
      }
      
      return isValid || false;
    }
    
    // If it's a JSON object, validate using the parsed data
    if (tokenData && typeof tokenData === 'object') {
      console.log('Validating JSON token:', tokenData);
      
      // Check if token has required fields
      if (!tokenData.admin_id || !tokenData.expires_at || !tokenData.token_type) {
        console.log('Token missing required fields');
        return false;
      }
      
      // Check token type
      if (tokenData.token_type !== 'admin_access') {
        console.log('Invalid token type:', tokenData.token_type);
        return false;
      }
      
      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (now > tokenData.expires_at) {
        console.log('Token expired:', { now, expires_at: tokenData.expires_at });
        return false;
      }
      
      // Verify admin exists
      const { data: adminExists, error: adminError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', tokenData.admin_id)
        .eq('username', tokenData.username)
        .single();
      
      if (adminError || !adminExists) {
        console.log('Admin user not found or error:', adminError);
        return false;
      }
      
      console.log('Token validation successful');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Token validation exception:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate admin authentication for all requests
    const authHeader = req.headers.get('authorization');
    const isValidAdmin = await validateAdminToken(authHeader);
    
    if (!isValidAdmin) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized: Invalid or expired admin token' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Admin access granted for dashboard request');
    
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    // Add security headers
    const securityHeaders = {
      ...corsHeaders,
      'Content-Security-Policy': "default-src 'self'",
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };

    if (req.method === 'GET') {
      const status = url.searchParams.get('status');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = (page - 1) * limit;

      let query = supabase
        .from('offramp_requests')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: requests, error: requestsError, count } = await query;
      
      if (requestsError) {
        console.error('Error fetching requests:', requestsError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch requests'
        }), {
          status: 500,
          headers: { ...securityHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch statistics
      const { data: stats, error: statsError } = await supabase
        .rpc('get_request_stats');

      if (statsError) {
        console.error('Error fetching stats:', statsError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch statistics'
        }), {
          status: 500,
          headers: { ...securityHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        data: {
          requests: requests || [],
          stats: stats || {},
          pagination: {
            page,
            limit,
            total: count || 0,
            hasMore: (count || 0) > offset + limit
          }
        }
      }), {
        headers: { ...securityHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      const { table, id, status, notes, transaction_hash } = await req.json();
      
      // Input sanitization
      const sanitizedNotes = notes ? notes.trim().substring(0, 1000) : notes;
      const sanitizedTxHash = transaction_hash ? transaction_hash.trim().substring(0, 100) : transaction_hash;
      
      // Handle GET requests for onramp data
      if (table === 'onramp_requests' && !id) {
        const { data: requests, error } = await supabase
          .from('onramp_requests')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching onramp requests:', error);
          return new Response(JSON.stringify({
            success: false,
            error: 'Failed to fetch onramp requests'
          }), {
            status: 500,
            headers: { ...securityHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        return new Response(JSON.stringify({
          success: true,
          data: { requests: requests || [] }
        }), {
          headers: { ...securityHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Handle updates
      if (!id) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Request ID is required for updates'
        }), {
          status: 400,
          headers: { ...securityHeaders, 'Content-Type': 'application/json' },
        });
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (sanitizedNotes !== undefined) updateData.notes = sanitizedNotes;
      if (sanitizedTxHash !== undefined) updateData.transaction_hash = sanitizedTxHash;

      const tableName = table === 'onramp_requests' ? 'onramp_requests' : 'offramp_requests';
      
      const { data, error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating ${tableName}:`, error);
        return new Response(JSON.stringify({
          success: false,
          error: `Failed to update ${tableName.replace('_', ' ')}`
        }), {
          status: 500,
          headers: { ...securityHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        data: data
      }), {
        headers: { ...securityHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'PATCH') {
      // Update request status
      const { id, status, notes, transaction_hash, table } = await req.json();

      if (!id || !status) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: id, status' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const targetTable = table || 'offramp_requests';
      const updateData: any = { status };
      if (notes) updateData.notes = notes;
      if (transaction_hash) updateData.transaction_hash = transaction_hash;

      const { data: updatedRequest, error: updateError } = await supabase
        .from(targetTable)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update ${targetTable}`);
      }

      return new Response(JSON.stringify({
        success: true,
        data: updatedRequest
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: { ...securityHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in admin-dashboard function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { ...securityHeaders, 'Content-Type': 'application/json' },
    });
  }
});