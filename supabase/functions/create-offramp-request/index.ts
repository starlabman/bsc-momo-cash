import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Token addresses on BSC
const TOKEN_ADDRESSES = {
  'USDC': '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
  'USDT': '0x55d398326f99059fF775485246999027B3197955'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, token, momoNumber, momoProvider } = await req.json();

    console.log('Creating offramp request:', { amount, token, momoNumber, momoProvider });

    // Validation
    if (!amount || !token || !momoNumber) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields: amount, token, momoNumber' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (amount <= 0 || amount > 1000) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Amount must be between 0 and 1000 USD' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!['USDC', 'USDT'].includes(token)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Token must be USDC or USDT' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get current exchange rate
    const { data: rateConfig, error: rateError } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('base_currency', 'USD')
      .eq('target_currency', 'XOF')
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();

    if (rateError) {
      console.error('Error fetching rate config:', rateError);
      throw new Error('Failed to fetch exchange rate');
    }

    const margin = rateConfig?.margin || 0.10;
    const finalRate = rateConfig.rate * (1 - margin);
    const xofAmount = amount * finalRate;

    // Create offramp request
    const { data: request, error: insertError } = await supabase
      .from('offramp_requests')
      .insert({
        amount: amount,
        token: token,
        momo_number: momoNumber,
        momo_provider: momoProvider,
        usd_amount: amount,
        xof_amount: xofAmount,
        exchange_rate: finalRate,
        request_ip: req.headers.get('x-forwarded-for') || 'unknown'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating request:', insertError);
      throw new Error('Failed to create offramp request');
    }

    const result = {
      success: true,
      data: {
        id: request.id,
        amount: amount,
        token: token,
        momo_number: momoNumber,
        momo_provider: momoProvider,
        xof_amount: xofAmount,
        exchange_rate: finalRate,
        bsc_address: request.bsc_address,
        token_address: TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES],
        status: request.status,
        created_at: request.created_at
      }
    };

    console.log('Offramp request created:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-offramp-request function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});