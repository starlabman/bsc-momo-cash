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

    const { token, country_id, is_visible, bulk_action } = await req.json();

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

    // Bulk toggle all countries
    if (bulk_action === 'enable_all' || bulk_action === 'disable_all') {
      const newVisible = bulk_action === 'enable_all';

      const { error } = await supabase
        .from('country_visibility')
        .update({ is_visible: newVisible })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // match all

      if (error) throw error;

      // Cascade: get all country IDs and update their operators
      const { data: allCountries } = await supabase
        .from('country_visibility')
        .select('country_id');

      if (allCountries && allCountries.length > 0) {
        const countryIds = allCountries.map((c: any) => c.country_id);
        if (!newVisible) {
          // Disable all operators for all countries
          await supabase
            .from('mobile_operators')
            .update({ is_visible: false })
            .in('country_id', countryIds);
        }
      }

      return new Response(JSON.stringify({ success: true, bulk: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (typeof country_id !== 'string' || typeof is_visible !== 'boolean') {
      return new Response(JSON.stringify({ error: 'Paramètres invalides' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase
      .from('country_visibility')
      .update({ is_visible })
      .eq('country_id', country_id)
      .select()
      .single();

    if (error) throw error;

    // Cascade: when disabling a country, disable all its operators
    if (!is_visible) {
      await supabase
        .from('mobile_operators')
        .update({ is_visible: false })
        .eq('country_id', country_id);
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
