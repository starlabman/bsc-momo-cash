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
    console.log('Fetching exchange rate...');

    // For demo purposes, use a fixed rate since external API might be unavailable
    // In production, you would fetch from a reliable exchange rate API
    let externalRate = 655.50; // Fixed USD to XOF rate for demo
    
    try {
      const response = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=XOF', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; OfframpApp/1.0)'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.rates && data.rates.XOF) {
          externalRate = data.rates.XOF;
          console.log('External rate fetched successfully:', externalRate);
        }
      }
    } catch (error) {
      console.log('External API unavailable, using fallback rate:', externalRate);
    }
    console.log('External rate fetched:', externalRate);

    // Get margin from database
    const { data: rateConfig, error: rateError } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('base_currency', 'USD')
      .eq('target_currency', 'XOF')
      .order('last_updated', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rateError) {
      console.error('Error fetching rate config:', rateError);
      throw new Error('Failed to fetch rate configuration');
    }

    const margin = rateConfig?.margin || 0.10;
    const finalRate = externalRate * (1 - margin);

    // Update the rate in database if config exists
    if (rateConfig) {
      const { error: updateError } = await supabase
        .from('exchange_rates')
        .update({
          rate: externalRate,
          last_updated: new Date().toISOString()
        })
        .eq('id', rateConfig.id);

      if (updateError) {
        console.error('Error updating rate:', updateError);
      }
    }

    const result = {
      success: true,
      data: {
        base_currency: 'USD',
        target_currency: 'XOF',
        external_rate: externalRate,
        margin: margin,
        final_rate: finalRate,
        last_updated: new Date().toISOString()
      }
    };

    console.log('Rate calculation result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-exchange-rate function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});