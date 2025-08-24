import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Security-Policy': "default-src 'self'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
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

// Helper function to validate admin JWT token
async function validateAdminToken(authHeader: string | null): Promise<{ valid: boolean; adminId?: string; username?: string }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false };
  }

  const token = authHeader.substring(7);
  
  try {
    const { data: isValid, error } = await supabase
      .rpc('validate_admin_jwt', { p_token: token });
    
    if (error || !isValid) {
      return { valid: false };
    }
    
    // Parse token to get admin info
    const tokenData = JSON.parse(token);
    return { 
      valid: true, 
      adminId: tokenData.admin_id,
      username: tokenData.username 
    };
  } catch (error) {
    console.error('Token validation exception:', error);
    return { valid: false };
  }
}

async function logAuditEvent(adminId: string, username: string, action: string, entityType: string, entityId: string, details: any, clientIP: string) {
  try {
    const { error } = await supabase
      .from('admin_audit_logs')
      .insert({
        admin_id: adminId,
        admin_username: username,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
        ip_address: clientIP,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error logging audit event:', error);
    }
  } catch (error) {
    console.error('Exception logging audit event:', error);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate admin authentication
    const authHeader = req.headers.get('authorization');
    const adminAuth = await validateAdminToken(authHeader);
    
    if (!adminAuth.valid) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized: Invalid or expired admin token' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';

    if (req.method === 'POST') {
      const { action, entityType, entityId, details } = await req.json();
      
      if (!action || !entityType || !entityId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing required audit fields'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await logAuditEvent(
        adminAuth.adminId!,
        adminAuth.username!,
        action,
        entityType,
        entityId,
        details,
        clientIP
      );

      return new Response(JSON.stringify({
        success: true,
        message: 'Audit log recorded'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      
      const { data: auditLogs, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching audit logs:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch audit logs'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        data: auditLogs || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in admin-audit-log function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});