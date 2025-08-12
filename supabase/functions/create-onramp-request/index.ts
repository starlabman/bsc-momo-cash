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
    const { xofAmount, token, momoNumber, momoProvider, recipientAddress } = await req.json();

    console.log('Creating onramp request:', { xofAmount, token, momoNumber, momoProvider, recipientAddress });

    // Validation
    if (!xofAmount || !token || !momoNumber || !recipientAddress) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields: xofAmount, token, momoNumber, recipientAddress' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (xofAmount <= 0 || xofAmount > 600000) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Amount must be between 0 and 600,000 XOF' 
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

    // Basic BSC address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid BSC address format' 
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
    const usdAmount = xofAmount / finalRate;
    const cryptoAmount = usdAmount; // 1:1 for stablecoins

    // Create onramp request
    const { data: request, error: insertError } = await supabase
      .from('onramp_requests')
      .insert({
        xof_amount: xofAmount,
        usd_amount: usdAmount,
        crypto_amount: cryptoAmount,
        token: token,
        momo_number: momoNumber,
        momo_provider: momoProvider,
        recipient_address: recipientAddress,
        exchange_rate: finalRate,
        request_ip: req.headers.get('x-forwarded-for') || 'unknown'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating request:', insertError);
      throw new Error('Failed to create onramp request');
    }

    const result = {
      success: true,
      data: {
        id: request.id,
        xof_amount: xofAmount,
        usd_amount: usdAmount,
        crypto_amount: cryptoAmount,
        token: token,
        momo_number: momoNumber,
        momo_provider: momoProvider,
        recipient_address: recipientAddress,
        exchange_rate: finalRate,
        status: request.status,
        created_at: request.created_at
      }
    };

    console.log('Onramp request created:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-onramp-request function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});