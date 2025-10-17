import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Allowed mobile operators for validation
const ALLOWED_MOMO_PROVIDERS = ['MTN', 'Moov', 'Orange', 'Wave', 'Free'];

// Validation schema using zod
const onrampRequestSchema = z.object({
  xofAmount: z.number().min(100).max(600000),
  token: z.enum(['USDC', 'USDT']),
  momoNumber: z.string()
    .min(8)
    .max(20)
    .regex(/^[\d+\s()-]+$/, 'Mobile number must contain only digits, +, spaces, (), or -'),
  momoProvider: z.string()
    .max(50)
    .optional()
    .refine((val) => !val || ALLOWED_MOMO_PROVIDERS.includes(val), {
      message: 'Invalid mobile operator'
    }),
  recipientAddress: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid BSC address format'),
  countryId: z.string().uuid().optional()
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();

    // Validate and sanitize input using zod schema
    const validationResult = onrampRequestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.errors);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid input data',
        details: validationResult.error.errors[0]?.message || 'Validation failed'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { xofAmount, token, momoNumber, momoProvider, recipientAddress, countryId } = validationResult.data;

    // Sanitize mobile number - remove all non-digit/+ characters
    const sanitizedMomoNumber = momoNumber.replace(/[^\d+]/g, '');
    
    console.log('Creating onramp request with validated data');

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

    // Create onramp request with sanitized data
    const { data: request, error: insertError } = await supabase
      .from('onramp_requests')
      .insert({
        xof_amount: xofAmount,
        usd_amount: usdAmount,
        crypto_amount: cryptoAmount,
        token: token,
        momo_number: sanitizedMomoNumber,
        momo_provider: momoProvider,
        recipient_address: recipientAddress,
        country_id: countryId,
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
        momo_number: sanitizedMomoNumber,
        momo_provider: momoProvider,
        recipient_address: recipientAddress,
        exchange_rate: finalRate,
        status: request.status,
        created_at: request.created_at
      }
    };

    console.log('Onramp request created successfully');

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