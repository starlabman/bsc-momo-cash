import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (req.method === 'GET') {
      // Get all offramp requests with pagination
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const status = url.searchParams.get('status');
      const offset = (page - 1) * limit;

      let query = supabase
        .from('offramp_requests')
        .select(`
          *,
          blockchain_events(*)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: requests, error: requestsError } = await query;

      if (requestsError) {
        throw new Error('Failed to fetch offramp requests');
      }

      // Get summary stats
      const { data: stats, error: statsError } = await supabase
        .rpc('get_request_stats');

      const result = {
        success: true,
        data: {
          requests: requests || [],
          pagination: {
            page,
            limit,
            total: requests?.length || 0
          },
          stats: stats || {
            pending_payment: 0,
            received: 0,
            processing: 0,
            paid: 0,
            failed: 0,
            total_volume_usd: 0,
            total_volume_xof: 0
          }
        }
      };

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'PATCH') {
      // Update request status
      const { id, status, notes, transaction_hash } = await req.json();

      if (!id || !status) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: id, status' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const updateData: any = { status };
      if (notes) updateData.notes = notes;
      if (transaction_hash) updateData.transaction_hash = transaction_hash;

      const { data: updatedRequest, error: updateError } = await supabase
        .from('offramp_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw new Error('Failed to update offramp request');
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in admin-dashboard function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});