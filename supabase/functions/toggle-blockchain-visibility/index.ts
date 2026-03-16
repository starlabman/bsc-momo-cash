import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { token, network_id, is_visible, bulk_action } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token requis' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: validToken } = await supabase.rpc('validate_admin_jwt', { p_token: token });
    if (!validToken) {
      return new Response(JSON.stringify({ error: 'Token invalide' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Bulk toggle all blockchains
    if (bulk_action === 'enable_all' || bulk_action === 'disable_all') {
      const newVisible = bulk_action === 'enable_all';

      const { error } = await supabase
        .from('blockchain_visibility')
        .update({ is_visible: newVisible })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      // Cascade: update all tokens
      if (!newVisible) {
        await supabase
          .from('token_visibility')
          .update({ is_visible: false })
          .neq('id', '00000000-0000-0000-0000-000000000000');
      }

      return new Response(JSON.stringify({ success: true, bulk: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (typeof network_id !== 'string' || typeof is_visible !== 'boolean') {
      return new Response(JSON.stringify({ error: 'Paramètres invalides' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase
      .from('blockchain_visibility')
      .update({ is_visible })
      .eq('network_id', network_id)
      .select()
      .single();

    if (error) throw error;

    // Cascade: when disabling a blockchain, disable all its tokens
    if (!is_visible) {
      await supabase
        .from('token_visibility')
        .update({ is_visible: false })
        .eq('network_id', network_id);
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
