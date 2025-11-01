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

// Token addresses on BSC
const TOKEN_ADDRESSES = {
  'USDC': '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
  'USDT': '0x55d398326f99059fF775485246999027B3197955'
};


// Validation schema using zod
const offrampRequestSchema = z.object({
  amount: z.number().min(0.01).max(1000),
  token: z.enum(['USDC', 'USDT']),
  network: z.string().optional(),
  tokenAddress: z.string().optional(),
  momoNumber: z.string()
    .min(8)
    .max(20)
    .regex(/^[\d+\s()-]+$/, 'Mobile number must contain only digits, +, spaces, (), or -'),
  momoProvider: z.string()
    .max(50)
    .optional(),
  countryId: z.string().uuid().optional(),
  generatePaymentLink: z.boolean().optional(),
  requesterName: z.string().max(100).optional()
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();

    // Validate and sanitize input using zod schema
    const validationResult = offrampRequestSchema.safeParse(rawBody);
    
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

    const { amount, token, network, tokenAddress, momoNumber, momoProvider, countryId, generatePaymentLink, requesterName } = validationResult.data;

    // Sanitize mobile number - remove all non-digit/+ characters
    const sanitizedMomoNumber = momoNumber.replace(/[^\d+]/g, '');
    
    // Combine token and network for storage (e.g., "USDC-BSC")
    const tokenWithNetwork = network ? `${token}-${network.toUpperCase()}` : token;
    
    // Generate payment link token if requested
    let paymentLinkToken = null;
    let linkExpiresAt = null;
    if (generatePaymentLink) {
      paymentLinkToken = crypto.randomUUID();
      // Link expires in 7 days
      linkExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }
    
    console.log('Creating offramp request with validated data', { token, network, tokenWithNetwork, generatePaymentLink });

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

    // Create offramp request with sanitized data
    const { data: request, error: insertError } = await supabase
      .from('offramp_requests')
      .insert({
        amount: amount,
        token: tokenWithNetwork,
        momo_number: sanitizedMomoNumber,
        momo_provider: momoProvider,
        usd_amount: amount,
        xof_amount: xofAmount,
        exchange_rate: finalRate,
        country_id: countryId,
        request_ip: req.headers.get('x-forwarded-for') || 'unknown',
        payment_link_token: paymentLinkToken,
        link_expires_at: linkExpiresAt,
        requester_name: requesterName,
        paid_via_link: generatePaymentLink ? false : null
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
        token: tokenWithNetwork,
        momo_number: sanitizedMomoNumber,
        momo_provider: momoProvider,
        xof_amount: xofAmount,
        exchange_rate: finalRate,
        bsc_address: request.bsc_address,
        token_address: TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES],
        status: request.status,
        created_at: request.created_at,
        payment_link_token: paymentLinkToken,
        payment_link: paymentLinkToken ? `${req.headers.get('origin') || 'https://xusensadnrsodukuzndm.lovable.app'}/pay/${paymentLinkToken}` : null
      }
    };

    console.log('Offramp request created successfully');

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