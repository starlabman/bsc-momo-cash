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
    const { token } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Payment link token is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching payment request for token:', token);

    // Try to fetch from offramp_requests first
    const { data: offrampRequest, error: offrampError } = await supabase
      .from('offramp_requests')
      .select('*')
      .eq('payment_link_token', token)
      .gt('link_expires_at', new Date().toISOString())
      .single();

    if (offrampRequest && !offrampError) {
      console.log('Found offramp request');
      return new Response(JSON.stringify({
        success: true,
        data: {
          ...offrampRequest,
          type: 'offramp'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If not found in offramp, try onramp_requests
    const { data: onrampRequest, error: onrampError } = await supabase
      .from('onramp_requests')
      .select('*')
      .eq('payment_link_token', token)
      .gt('link_expires_at', new Date().toISOString())
      .single();

    if (onrampRequest && !onrampError) {
      console.log('Found onramp request');
      return new Response(JSON.stringify({
        success: true,
        data: {
          ...onrampRequest,
          type: 'onramp'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If not found in either table
    console.log('Payment request not found or expired');
    return new Response(JSON.stringify({
      success: false,
      error: 'Payment request not found or expired'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-payment-request function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
