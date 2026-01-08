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

// Validation schema
const searchSchema = z.object({
  phoneNumber: z.string()
    .min(6, 'Numéro de téléphone trop court')
    .max(20, 'Numéro de téléphone trop long')
    .regex(/^[\d+\s()-]+$/, 'Format de numéro invalide'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    
    // Validate input
    const validationResult = searchSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: validationResult.error.errors[0]?.message || 'Validation failed'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { phoneNumber } = validationResult.data;
    
    // Sanitize phone number - keep only digits and +
    const sanitizedPhone = phoneNumber.replace(/[^\d+]/g, '');
    
    console.log('Searching transactions for phone:', sanitizedPhone);

    // Fetch offramp requests using service role (bypasses RLS)
    const { data: offrampData, error: offrampError } = await supabase
      .from('offramp_requests')
      .select('id, amount, xof_amount, status, created_at, reference_id')
      .ilike('momo_number', `%${sanitizedPhone}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (offrampError) {
      console.error('Offramp query error:', offrampError);
    }

    // Fetch onramp requests using service role (bypasses RLS)
    const { data: onrampData, error: onrampError } = await supabase
      .from('onramp_requests')
      .select('id, crypto_amount, xof_amount, status, created_at, reference_id')
      .ilike('momo_number', `%${sanitizedPhone}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (onrampError) {
      console.error('Onramp query error:', onrampError);
    }

    // Combine and format transactions
    const transactions = [
      ...(offrampData || []).map(tx => ({
        id: tx.id,
        type: 'offramp',
        amount: tx.amount,
        xof_amount: tx.xof_amount,
        status: tx.status,
        created_at: tx.created_at,
        reference_id: tx.reference_id,
      })),
      ...(onrampData || []).map(tx => ({
        id: tx.id,
        type: 'onramp',
        amount: tx.crypto_amount,
        xof_amount: tx.xof_amount,
        status: tx.status,
        created_at: tx.created_at,
        reference_id: tx.reference_id,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log(`Found ${transactions.length} transactions`);

    return new Response(JSON.stringify({
      success: true,
      data: transactions
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in search-transactions:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
