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


// Address format validators
const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const recipientAddressSchema = z.string().min(1).refine(
  (addr) => EVM_ADDRESS_REGEX.test(addr) || SOLANA_ADDRESS_REGEX.test(addr),
  { message: 'Invalid blockchain address. Must be a valid EVM (0x...) or Solana address.' }
);

// Validation schema using zod
const onrampRequestSchema = z.object({
  xofAmount: z.number().min(100).max(600000),
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
  recipientAddress: recipientAddressSchema,
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

    const { xofAmount, token, network, tokenAddress, momoNumber, momoProvider, recipientAddress, countryId, generatePaymentLink, requesterName } = validationResult.data;

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
    
    console.log('Creating onramp request with validated data', { token, network, tokenWithNetwork, generatePaymentLink });

    // Fetch fresh exchange rate
    const { data: exchangeRateData, error: exchangeRateError } = await supabase.functions.invoke('get-exchange-rate');
    
    if (exchangeRateError) {
      console.error('Error fetching exchange rate:', exchangeRateError);
      throw new Error('Failed to fetch exchange rate');
    }

    const rateInfo = exchangeRateData.data;
    const finalRate = rateInfo.final_rate;
    const margin = rateInfo.margin;
    const usdAmount = xofAmount / finalRate;
    const cryptoAmount = usdAmount; // 1:1 for stablecoins

    // Create onramp request with sanitized data
    const { data: request, error: insertError } = await supabase
      .from('onramp_requests')
      .insert({
        xof_amount: xofAmount,
        usd_amount: usdAmount,
        crypto_amount: cryptoAmount,
        token: tokenWithNetwork,
        momo_number: sanitizedMomoNumber,
        momo_provider: momoProvider,
        recipient_address: recipientAddress,
        country_id: countryId,
        exchange_rate: finalRate,
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
      throw new Error('Failed to create onramp request');
    }

    const result = {
      success: true,
      data: {
        id: request.id,
        reference_id: request.reference_id,
        xof_amount: xofAmount,
        usd_amount: usdAmount,
        crypto_amount: cryptoAmount,
        token: tokenWithNetwork,
        momo_number: sanitizedMomoNumber,
        momo_provider: momoProvider,
        recipient_address: recipientAddress,
        exchange_rate: finalRate,
        status: request.status,
        created_at: request.created_at,
        payment_link_token: paymentLinkToken,
        payment_link: paymentLinkToken ? `${req.headers.get('origin') || 'https://xusensadnrsodukuzndm.lovable.app'}/pay/${paymentLinkToken}` : null
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