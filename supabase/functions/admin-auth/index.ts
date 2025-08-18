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

      // Verify admin credentials using secure password hashing
      const { data: isValid, error: authError } = await supabase
        .rpc('verify_admin_password', {
          p_username: username,
          p_password: password
        });

      if (authError || !isValid) {
        console.log('Admin login attempt failed for username:', username);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Invalid credentials' 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get admin user details
      const { data: adminUser, error: userError } = await supabase
        .from('admin_users')
        .select('id, username')
        .eq('username', username)
        .single();

      if (userError || !adminUser) {
        console.log('Failed to retrieve admin user details for:', username);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Authentication failed' 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Admin login successful for username:', username);
      
      // Generate secure JWT token with expiration
      const { data: jwtToken, error: tokenError } = await supabase
        .rpc('create_admin_jwt', {
          p_admin_id: adminUser.id,
          p_username: adminUser.username
        });

      if (tokenError || !jwtToken) {
        console.log('Failed to create JWT token for:', username);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Token generation failed' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        data: {
          token: jwtToken,
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