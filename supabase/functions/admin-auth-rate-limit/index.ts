import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Security-Policy': "default-src 'self'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
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

// Rate limiting configuration
const RATE_LIMIT_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const rateLimitStore = new Map();

function getRateLimitKey(ip: string): string {
  return `admin_login_${ip}`;
}

function isRateLimited(ip: string): boolean {
  const key = getRateLimitKey(ip);
  const now = Date.now();
  const attempts = rateLimitStore.get(key) || [];
  
  // Clean old attempts
  const recentAttempts = attempts.filter((timestamp: number) => now - timestamp < RATE_LIMIT_WINDOW);
  rateLimitStore.set(key, recentAttempts);
  
  return recentAttempts.length >= RATE_LIMIT_ATTEMPTS;
}

function recordFailedAttempt(ip: string): void {
  const key = getRateLimitKey(ip);
  const attempts = rateLimitStore.get(key) || [];
  attempts.push(Date.now());
  rateLimitStore.set(key, attempts);
}

function sanitizeInput(input: string): string {
  if (!input) return '';
  return input.trim().substring(0, 100).replace(/[<>]/g, '');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method === 'POST') {
      const clientIP = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
      
      // Check rate limiting
      if (isRateLimited(clientIP)) {
        console.log(`Rate limit exceeded for IP: ${clientIP}`);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { username, password } = await req.json();

      // Input sanitization
      const sanitizedUsername = sanitizeInput(username);
      const sanitizedPassword = sanitizeInput(password);

      if (!sanitizedUsername || !sanitizedPassword) {
        recordFailedAttempt(clientIP);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Nom d\'utilisateur et mot de passe requis' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify admin credentials using the database function
      const { data: isValid, error: verifyError } = await supabase
        .rpc('verify_admin_password', {
          p_username: sanitizedUsername,
          p_password: sanitizedPassword
        });

      if (verifyError || !isValid) {
        recordFailedAttempt(clientIP);
        console.log(`Failed login attempt for username: ${sanitizedUsername}, IP: ${clientIP}`);
        
        // Progressive delay for failed attempts
        const key = getRateLimitKey(clientIP);
        const attempts = rateLimitStore.get(key) || [];
        const delay = Math.min(attempts.length * 1000, 5000); // Max 5 second delay
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Identifiants invalides' 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get admin user details
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id, username')
        .eq('username', sanitizedUsername)
        .single();

      if (adminError || !adminUser) {
        recordFailedAttempt(clientIP);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Utilisateur administrateur non trouvé' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create admin JWT token with shorter expiration
      const { data: token, error: tokenError } = await supabase
        .rpc('create_admin_jwt', {
          p_admin_id: adminUser.id,
          p_username: adminUser.username
        });

      if (tokenError) {
        recordFailedAttempt(clientIP);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Échec de la génération du token' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Log successful login
      console.log(`Successful admin login: ${adminUser.username}, IP: ${clientIP}`);
      
      // Clear failed attempts on successful login
      rateLimitStore.delete(getRateLimitKey(clientIP));

      return new Response(JSON.stringify({
        success: true,
        data: {
          token,
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
      error: 'Méthode non autorisée' 
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in admin-auth-rate-limit function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});