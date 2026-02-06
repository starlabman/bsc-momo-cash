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
    },
    db: {
      schema: 'public'
    }
  }
);

// Helper function to validate admin JWT token from Authorization header
async function validateAdminToken(authHeader: string | null): Promise<boolean> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  console.log('Received token for validation:', token);
  
  try {
    // Parse the token if it's a JSON string
    let tokenData;
    try {
      tokenData = JSON.parse(token);
    } catch {
      // If it's not JSON, try to validate as-is
      const { data: isValid, error } = await supabase
        .rpc('validate_admin_jwt', { p_token: token });
      
      if (error) {
        console.error('Token validation error:', error);
        return false;
      }
      
      return isValid || false;
    }
    
    // If it's a JSON object, validate using the parsed data
    if (tokenData && typeof tokenData === 'object') {
      console.log('Validating JSON token:', tokenData);
      
      // Check if token has required fields
      if (!tokenData.admin_id || !tokenData.expires_at || !tokenData.token_type) {
        console.log('Token missing required fields');
        return false;
      }
      
      // Check token type
      if (tokenData.token_type !== 'admin_access') {
        console.log('Invalid token type:', tokenData.token_type);
        return false;
      }
      
      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (now > tokenData.expires_at) {
        console.log('Token expired:', { now, expires_at: tokenData.expires_at });
        return false;
      }
      
      // Verify admin exists
      const { data: adminExists, error: adminError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', tokenData.admin_id)
        .eq('username', tokenData.username)
        .single();
      
      if (adminError || !adminExists) {
        console.log('Admin user not found or error:', adminError);
        return false;
      }
      
      console.log('Token validation successful');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Token validation exception:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== ADMIN DASHBOARD REQUEST START ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    // Create admin supabase client for database operations
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Validate admin authentication for all requests
    const authHeader = req.headers.get('authorization');
    console.log('Auth header received:', authHeader ? 'YES' : 'NO');
    
    if (authHeader) {
      console.log('Auth header value:', authHeader.substring(0, 50) + '...');
    }
    
    const isValidAdmin = await validateAdminToken(authHeader);
    console.log('Token validation result:', isValidAdmin);
    
    if (!isValidAdmin) {
      console.log('ACCESS DENIED: Invalid token');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized: Invalid or expired admin token' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

      console.log('ACCESS GRANTED: Valid admin token');
    
    // Extract admin info from token for audit logging
    let adminId = null;
    let adminUsername = null;
    try {
      const tokenData = JSON.parse(authHeader.substring(7));
      adminId = tokenData.admin_id;
      adminUsername = tokenData.username;
    } catch (error) {
      console.error('Error extracting admin info from token:', error);
    }
    
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    // Add security headers
    const securityHeaders = {
      ...corsHeaders,
      'Content-Security-Policy': "default-src 'self'",
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };

    if (req.method === 'GET') {
      const status = url.searchParams.get('status');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = (page - 1) * limit;

      console.log('Attempting to fetch offramp requests...');

      let query = adminSupabase
        .from('offramp_requests')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      console.log('Executing query for offramp requests...');
      const { data: requests, error: requestsError, count } = await query;
      
      if (requestsError) {
        console.error('Error fetching requests:', requestsError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch requests'
        }), {
          status: 500,
          headers: { ...securityHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Log admin access for audit trail
      if (adminId && adminUsername) {
        await adminSupabase.from('admin_audit_logs').insert({
          admin_id: adminId,
          admin_username: adminUsername,
          action: 'VIEW_OFFRAMP_REQUESTS',
          entity_type: 'offramp_requests',
          entity_id: 'bulk',
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          details: { count: requests?.length || 0, status_filter: status }
        });
      }

      // Fetch statistics
      console.log('Attempting to fetch stats...');
      const { data: stats, error: statsError } = await adminSupabase
        .rpc('get_request_stats');

      if (statsError) {
        console.error('Error fetching stats:', statsError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch statistics'
        }), {
          status: 500,
          headers: { ...securityHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch blockchain statistics from actual requests
      console.log('Attempting to fetch blockchain stats...');
      
      // Define all supported networks
      const supportedNetworks = ['Base', 'BSC', 'Ethereum', 'Arbitrum', 'Optimism', 'Polygon', 'Solana', 'Avalanche', 'Lisk'];
      
      // Get all offramp and onramp requests to analyze network usage
      const { data: allOfframpForNetwork, error: offrampNetError } = await adminSupabase
        .from('offramp_requests')
        .select('token, usd_amount, xof_amount, status, created_at');
      
      const { data: allOnrampForNetwork, error: onrampNetError } = await adminSupabase
        .from('onramp_requests')
        .select('token, usd_amount, xof_amount, status, created_at');

      // Combine all transactions for network analysis
      const allNetworkTransactions = [
        ...(allOfframpForNetwork || []).map((req: any) => ({ 
          ...req, 
          type: 'offramp',
          // Extract network from token (e.g., "USDT-BSC" -> "BSC")
          network: req.token?.includes('-') ? req.token.split('-')[1] : 'BSC'
        })),
        ...(allOnrampForNetwork || []).map((req: any) => ({ 
          ...req, 
          type: 'onramp',
          // Extract network from token
          network: req.token?.includes('-') ? req.token.split('-')[1] : 'BSC'
        }))
      ];

      // Calculate network statistics
      const networkStatsMap = new Map();
      
      // Initialize all supported networks with zero values
      supportedNetworks.forEach(network => {
        networkStatsMap.set(network, {
          network,
          volume: 0,
          count: 0,
          tokens: new Set(),
          offramp_count: 0,
          onramp_count: 0
        });
      });

      // Populate with actual data
      allNetworkTransactions.forEach((tx: any) => {
        const network = tx.network || 'BSC';
        if (!networkStatsMap.has(network)) {
          networkStatsMap.set(network, {
            network,
            volume: 0,
            count: 0,
            tokens: new Set(),
            offramp_count: 0,
            onramp_count: 0
          });
        }
        
        const stats = networkStatsMap.get(network);
        const amount = Number(tx.usd_amount || 0);
        stats.volume += amount;
        stats.count += 1;
        
        if (tx.type === 'offramp') {
          stats.offramp_count += 1;
        } else {
          stats.onramp_count += 1;
        }
        
        // Extract token symbol (e.g., "USDT-BSC" -> "USDT")
        const tokenSymbol = tx.token?.includes('-') ? tx.token.split('-')[0] : tx.token;
        if (tokenSymbol) {
          stats.tokens.add(tokenSymbol);
        }
      });

      const totalNetworkVolume = Array.from(networkStatsMap.values()).reduce((sum, stats) => sum + stats.volume, 0);
      const totalNetworkCount = Array.from(networkStatsMap.values()).reduce((sum, stats) => sum + stats.count, 0);

      const volumeByNetwork = Array.from(networkStatsMap.values())
        .map((item: any) => ({
          network: item.network,
          volume: item.volume,
          count: item.count,
          unique_tokens: item.tokens.size,
          offramp_count: item.offramp_count,
          onramp_count: item.onramp_count,
          percentage: totalNetworkVolume > 0 ? (item.volume / totalNetworkVolume) * 100 : 0
        }))
        .sort((a, b) => b.volume - a.volume);

      const networksWithActivity = volumeByNetwork.filter(n => n.count > 0);
      const highestVolumeNetwork = networksWithActivity.length > 0 ? networksWithActivity[0] : null;
      const lowestVolumeNetwork = networksWithActivity.length > 0 ? networksWithActivity[networksWithActivity.length - 1] : null;

      const blockchainStats = {
        total_events: totalNetworkCount,
        processed_events: allNetworkTransactions.filter((tx: any) => 
          tx.status === 'paid' || tx.status === 'completed'
        ).length,
        pending_events: allNetworkTransactions.filter((tx: any) => 
          tx.status === 'pending_payment' || tx.status === 'pending_momo_payment' || tx.status === 'processing' || tx.status === 'received' || tx.status === 'momo_payment_received'
        ).length,
        total_volume: totalNetworkVolume,
        unique_networks: networksWithActivity.length,
        supported_networks: supportedNetworks.length,
        volume_by_network: volumeByNetwork,
        highest_volume_network: highestVolumeNetwork,
        lowest_volume_network: lowestVolumeNetwork
      };

      // Fetch country statistics
      console.log('Attempting to fetch country stats...');
      const { data: countries, error: countriesError } = await adminSupabase
        .from('countries')
        .select('*');

      if (countriesError) {
        console.error('Error fetching countries:', countriesError);
      }

      // Calculate stats by country for both offramp and onramp WITH blockchain details
      const { data: allOfframpRequestsFull, error: allOfframpError } = await adminSupabase
        .from('offramp_requests')
        .select('country_id, usd_amount, xof_amount, status, token');

      const { data: allOnrampRequestsFull, error: allOnrampError } = await adminSupabase
        .from('onramp_requests')
        .select('country_id, usd_amount, xof_amount, status, token');

      const countryStatsMap = new Map();
      
      // Helper function to extract network from token (e.g., "USDT-BSC" -> "BSC")
      const extractNetwork = (token: string) => token?.includes('-') ? token.split('-')[1] : 'BSC';
      const extractTokenSymbol = (token: string) => token?.includes('-') ? token.split('-')[0] : token;
      
      // Process offramp requests
      allOfframpRequestsFull?.forEach((req: any) => {
        const countryId = req.country_id || 'unknown';
        if (!countryStatsMap.has(countryId)) {
          countryStatsMap.set(countryId, {
            offramp_count: 0,
            onramp_count: 0,
            offramp_volume_usd: 0,
            offramp_volume_xof: 0,
            onramp_volume_usd: 0,
            onramp_volume_xof: 0,
            total_transactions: 0,
            networks_used: new Map(), // Map<network, {count, volume_usd, offramp_count, onramp_count}>
            tokens_used: new Set()
          });
        }
        const stats = countryStatsMap.get(countryId);
        stats.offramp_count += 1;
        stats.offramp_volume_usd += parseFloat(req.usd_amount || 0);
        stats.offramp_volume_xof += parseFloat(req.xof_amount || 0);
        stats.total_transactions += 1;
        
        // Track network usage
        const network = extractNetwork(req.token);
        if (!stats.networks_used.has(network)) {
          stats.networks_used.set(network, { count: 0, volume_usd: 0, offramp_count: 0, onramp_count: 0 });
        }
        const networkStats = stats.networks_used.get(network);
        networkStats.count += 1;
        networkStats.volume_usd += parseFloat(req.usd_amount || 0);
        networkStats.offramp_count += 1;
        
        // Track tokens
        const tokenSymbol = extractTokenSymbol(req.token);
        if (tokenSymbol) stats.tokens_used.add(tokenSymbol);
      });

      // Process onramp requests
      allOnrampRequestsFull?.forEach((req: any) => {
        const countryId = req.country_id || 'unknown';
        if (!countryStatsMap.has(countryId)) {
          countryStatsMap.set(countryId, {
            offramp_count: 0,
            onramp_count: 0,
            offramp_volume_usd: 0,
            offramp_volume_xof: 0,
            onramp_volume_usd: 0,
            onramp_volume_xof: 0,
            total_transactions: 0,
            networks_used: new Map(),
            tokens_used: new Set()
          });
        }
        const stats = countryStatsMap.get(countryId);
        stats.onramp_count += 1;
        stats.onramp_volume_usd += parseFloat(req.usd_amount || 0);
        stats.onramp_volume_xof += parseFloat(req.xof_amount || 0);
        stats.total_transactions += 1;
        
        // Track network usage
        const network = extractNetwork(req.token);
        if (!stats.networks_used.has(network)) {
          stats.networks_used.set(network, { count: 0, volume_usd: 0, offramp_count: 0, onramp_count: 0 });
        }
        const networkStats = stats.networks_used.get(network);
        networkStats.count += 1;
        networkStats.volume_usd += parseFloat(req.usd_amount || 0);
        networkStats.onramp_count += 1;
        
        // Track tokens
        const tokenSymbol = extractTokenSymbol(req.token);
        if (tokenSymbol) stats.tokens_used.add(tokenSymbol);
      });

      // Map country IDs to country details with blockchain breakdown
      const countryStats = Array.from(countryStatsMap.entries()).map(([countryId, stats]: [string, any]) => {
        const country = countries?.find((c: any) => c.id === countryId);
        
        // Convert networks Map to sorted array
        const totalNetworkVolume = Array.from(stats.networks_used.values()).reduce((sum: number, n: any) => sum + n.volume_usd, 0);
        const networks_breakdown = Array.from(stats.networks_used.entries())
          .map(([network, netStats]: [string, any]) => ({
            network,
            count: netStats.count,
            volume_usd: netStats.volume_usd,
            offramp_count: netStats.offramp_count,
            onramp_count: netStats.onramp_count,
            percentage: totalNetworkVolume > 0 ? (netStats.volume_usd / totalNetworkVolume) * 100 : 0
          }))
          .sort((a, b) => b.volume_usd - a.volume_usd);
        
        return {
          country_id: countryId,
          country_name: country?.name || 'Unknown',
          country_code: country?.code || 'N/A',
          flag_emoji: country?.flag_emoji || '',
          offramp_count: stats.offramp_count,
          onramp_count: stats.onramp_count,
          offramp_volume_usd: stats.offramp_volume_usd,
          offramp_volume_xof: stats.offramp_volume_xof,
          onramp_volume_usd: stats.onramp_volume_usd,
          onramp_volume_xof: stats.onramp_volume_xof,
          total_transactions: stats.total_transactions,
          total_volume_usd: stats.offramp_volume_usd + stats.onramp_volume_usd,
          total_volume_xof: stats.offramp_volume_xof + stats.onramp_volume_xof,
          networks_breakdown,
          unique_networks: stats.networks_used.size,
          tokens_used: Array.from(stats.tokens_used),
          preferred_network: networks_breakdown[0]?.network || null
        };
      }).sort((a, b) => b.total_transactions - a.total_transactions);

      const totalCountryTransactions = countryStats.reduce((sum, c) => sum + c.total_transactions, 0);
      countryStats.forEach((c: any) => {
        c.percentage = totalCountryTransactions > 0 ? (c.total_transactions / totalCountryTransactions) * 100 : 0;
      });

      return new Response(JSON.stringify({
        success: true,
        data: {
          requests: requests || [],
          stats: stats || {},
          blockchainStats,
          countryStats: {
            by_country: countryStats,
            total_countries: countryStats.length,
            most_active_country: countryStats[0] || null,
            least_active_country: countryStats[countryStats.length - 1] || null
          },
          pagination: {
            page,
            limit,
            total: count || 0,
            hasMore: (count || 0) > offset + limit
          }
        }
      }), {
        headers: { ...securityHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      let requestBody;
      try {
        const text = await req.text();
        requestBody = text ? JSON.parse(text) : {};
      } catch (error) {
        console.error('Error parsing request body:', error);
        requestBody = {};
      }
      
      const { table, id, status, notes, transaction_hash } = requestBody;
      
      // Input sanitization
      const sanitizedNotes = notes ? notes.trim().substring(0, 1000) : notes;
      const sanitizedTxHash = transaction_hash ? transaction_hash.trim().substring(0, 100) : transaction_hash;
      
      // Handle GET requests for onramp data
      if (table === 'onramp_requests' && !id) {
        console.log('Attempting to fetch onramp requests...');
        const { data: requests, error } = await adminSupabase
          .from('onramp_requests')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching onramp requests:', error);
          return new Response(JSON.stringify({
            success: false,
            error: 'Failed to fetch onramp requests'
          }), {
            status: 500,
            headers: { ...securityHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Log admin access for audit trail
        if (adminId && adminUsername) {
          await adminSupabase.from('admin_audit_logs').insert({
            admin_id: adminId,
            admin_username: adminUsername,
            action: 'VIEW_ONRAMP_REQUESTS',
            entity_type: 'onramp_requests',
            entity_id: 'bulk',
            ip_address: req.headers.get('x-forwarded-for') || 'unknown',
            details: { count: requests?.length || 0 }
          });
        }
        
        return new Response(JSON.stringify({
          success: true,
          data: { requests: requests || [] }
        }), {
          headers: { ...securityHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Handle updates
      if (!id) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Request ID is required for updates'
        }), {
          status: 400,
          headers: { ...securityHeaders, 'Content-Type': 'application/json' },
        });
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (sanitizedNotes !== undefined) updateData.notes = sanitizedNotes;
      if (sanitizedTxHash !== undefined) updateData.transaction_hash = sanitizedTxHash;

      const tableName = table === 'onramp_requests' ? 'onramp_requests' : 'offramp_requests';
      
      const { data, error } = await adminSupabase
        .from(tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating ${tableName}:`, error);
        return new Response(JSON.stringify({
          success: false,
          error: `Failed to update ${tableName.replace('_', ' ')}`
        }), {
          status: 500,
          headers: { ...securityHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        data: data
      }), {
        headers: { ...securityHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'PATCH') {
      // Update request status
      let requestBody;
      try {
        const text = await req.text();
        requestBody = text ? JSON.parse(text) : {};
      } catch (error) {
        console.error('Error parsing request body:', error);
        requestBody = {};
      }
      
      const { id, status, notes, transaction_hash, table } = requestBody;

      if (!id || !status) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: id, status' 
        }), {
          status: 400,
          headers: { ...securityHeaders, 'Content-Type': 'application/json' },
        });
      }

      const targetTable = table || 'offramp_requests';
      const updateData: any = { status };
      if (notes) updateData.notes = notes;
      if (transaction_hash) updateData.transaction_hash = transaction_hash;

      const { data: updatedRequest, error: updateError } = await adminSupabase
        .from(targetTable)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update ${targetTable}`);
      }

      return new Response(JSON.stringify({
        success: true,
        data: updatedRequest
      }), {
        headers: { ...securityHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: { ...securityHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in admin-dashboard function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});