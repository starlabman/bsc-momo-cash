import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method === 'POST') {
      const { username, password } = await req.json();

      if (!username || !password) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Username and password are required' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify admin credentials using simple text comparison for now
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id, username')
        .eq('username', username)
        .eq('password_hash', password)
        .maybeSingle();

      if (adminError || !adminUser) {
        console.log('Admin login attempt failed for username:', username);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Invalid credentials' 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Admin login successful for username:', username);
      
      // Generate a simple session token (in production, use JWT)
      const sessionToken = `admin_${adminUser.id}_${Date.now()}`;

      return new Response(JSON.stringify({
        success: true,
        data: {
          token: sessionToken,
          admin: {
            id: adminUser.id,
            username: adminUser.username
          }
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Method not allowed' 
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in admin-auth function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});