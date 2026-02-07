import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-alchemy-token',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const DEPOSIT_ADDRESS = '0xf249F24182CdE7bAd264B60Ed38727Fd3674FE6A'.toLowerCase();

// Network-to-token mapping for reverse lookup
const NETWORK_TOKENS: Record<string, Record<string, { symbol: string; decimals: number }>> = {
  base: {
    '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': { symbol: 'USDC', decimals: 6 },
    '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca': { symbol: 'USDT', decimals: 6 }
  },
  bsc: {
    '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': { symbol: 'USDC', decimals: 18 },
    '0x55d398326f99059ff775485246999027b3197955': { symbol: 'USDT', decimals: 18 }
  },
  ethereum: {
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { symbol: 'USDC', decimals: 6 },
    '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: 'USDT', decimals: 6 }
  },
  arbitrum: {
    '0xaf88d065e77c8cc2239327c5edb3a432268e5831': { symbol: 'USDC', decimals: 6 },
    '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': { symbol: 'USDT', decimals: 6 }
  },
  optimism: {
    '0x0b2c639c533813f4aa9d7837caf62653d097ff85': { symbol: 'USDC', decimals: 6 },
    '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58': { symbol: 'USDT', decimals: 6 }
  },
  polygon: {
    '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': { symbol: 'USDC', decimals: 6 },
    '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': { symbol: 'USDT', decimals: 6 }
  },
  avalanche: {
    '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e': { symbol: 'USDC', decimals: 6 },
    '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7': { symbol: 'USDT', decimals: 6 }
  },
  lisk: {
    '0xf242275d3a6527d877f2c927a82d9b057609cc71': { symbol: 'USDC', decimals: 6 },
    '0x05d032ac25d322df992303dca074ee7392c117b9': { symbol: 'USDT', decimals: 6 }
  }
};

// ============================================================
// Alchemy Webhook Handler
// ============================================================

interface AlchemyWebhookEvent {
  webhookId: string;
  id: string;
  createdAt: string;
  type: string;
  event: {
    network: string;
    activity: Array<{
      fromAddress: string;
      toAddress: string;
      blockNum: string;
      hash: string;
      value: number;
      asset: string;
      category: string;
      rawContract: {
        rawValue: string;
        address: string;
        decimals: number;
      };
    }>;
  };
}

function mapAlchemyNetwork(alchemyNetwork: string): string | null {
  const mapping: Record<string, string> = {
    'ETH_MAINNET': 'ethereum',
    'BASE_MAINNET': 'base',
    'ARB_MAINNET': 'arbitrum',
    'OPT_MAINNET': 'optimism',
    'MATIC_MAINNET': 'polygon',
    'BSC_MAINNET': 'bsc',
    'AVAX_MAINNET': 'avalanche',
  };
  return mapping[alchemyNetwork] || null;
}

async function processAlchemyWebhook(body: AlchemyWebhookEvent): Promise<any[]> {
  const events: any[] = [];
  const network = mapAlchemyNetwork(body.event.network);

  if (!network) {
    console.log(`Unknown Alchemy network: ${body.event.network}`);
    return events;
  }

  const networkTokens = NETWORK_TOKENS[network] || {};

  for (const activity of body.event.activity) {
    if (activity.toAddress?.toLowerCase() !== DEPOSIT_ADDRESS) continue;
    if (activity.category !== 'token') continue;

    const contractAddr = activity.rawContract.address?.toLowerCase();
    const tokenInfo = networkTokens[contractAddr];
    
    if (!tokenInfo) {
      console.log(`Unknown token contract ${contractAddr} on ${network}`);
      continue;
    }

    // Check for duplicates
    const { data: existing } = await supabase
      .from('blockchain_events')
      .select('id')
      .eq('transaction_hash', activity.hash)
      .eq('network', network)
      .maybeSingle();

    if (existing) {
      console.log(`Duplicate transaction ${activity.hash} on ${network}, skipping`);
      continue;
    }

    events.push({
      transaction_hash: activity.hash,
      token_address: activity.rawContract.address,
      token_symbol: tokenInfo.symbol,
      from_address: activity.fromAddress,
      to_address: DEPOSIT_ADDRESS,
      amount: activity.value,
      block_number: parseInt(activity.blockNum, 16),
      network,
      webhook_source: 'alchemy',
      confirmed: true
    });
  }

  return events;
}

// ============================================================
// Moralis Webhook Handler
// ============================================================

interface MoralisWebhookEvent {
  confirmed: boolean;
  chainId: string;
  erc20Transfers: Array<{
    transactionHash: string;
    from: string;
    to: string;
    value: string;
    contract: string;
    tokenName: string;
    tokenSymbol: string;
    tokenDecimals: string;
  }>;
  block: {
    number: string;
    hash: string;
    timestamp: string;
  };
}

function mapMoralisChainId(chainId: string): string | null {
  const mapping: Record<string, string> = {
    '0x1': 'ethereum',
    '0x38': 'bsc',
    '0x89': 'polygon',
    '0x2105': 'base',
    '0xa4b1': 'arbitrum',
    '0xa': 'optimism',
    '0xa86a': 'avalanche',
  };
  return mapping[chainId] || null;
}

async function processMoralisWebhook(body: MoralisWebhookEvent): Promise<any[]> {
  const events: any[] = [];
  const network = mapMoralisChainId(body.chainId);

  if (!network) {
    console.log(`Unknown Moralis chain ID: ${body.chainId}`);
    return events;
  }

  for (const transfer of (body.erc20Transfers || [])) {
    if (transfer.to?.toLowerCase() !== DEPOSIT_ADDRESS) continue;

    const contractAddr = transfer.contract?.toLowerCase();
    const networkTokens = NETWORK_TOKENS[network] || {};
    const tokenInfo = networkTokens[contractAddr];

    if (!tokenInfo) continue;

    const { data: existing } = await supabase
      .from('blockchain_events')
      .select('id')
      .eq('transaction_hash', transfer.transactionHash)
      .eq('network', network)
      .maybeSingle();

    if (existing) continue;

    const amount = Number(transfer.value) / Math.pow(10, parseInt(transfer.tokenDecimals));

    events.push({
      transaction_hash: transfer.transactionHash,
      token_address: transfer.contract,
      token_symbol: tokenInfo.symbol,
      from_address: transfer.from,
      to_address: DEPOSIT_ADDRESS,
      amount,
      block_number: parseInt(body.block.number),
      network,
      webhook_source: 'moralis',
      confirmed: body.confirmed
    });
  }

  return events;
}

// ============================================================
// Generic Webhook Handler (manual/custom)
// ============================================================

interface GenericWebhookEvent {
  source: string;
  network: string;
  transactions: Array<{
    hash: string;
    from: string;
    to: string;
    amount: number;
    token_symbol: string;
    token_address: string;
    block_number?: number;
  }>;
}

async function processGenericWebhook(body: GenericWebhookEvent): Promise<any[]> {
  const events: any[] = [];

  for (const tx of (body.transactions || [])) {
    if (tx.to?.toLowerCase() !== DEPOSIT_ADDRESS) continue;

    const { data: existing } = await supabase
      .from('blockchain_events')
      .select('id')
      .eq('transaction_hash', tx.hash)
      .eq('network', body.network)
      .maybeSingle();

    if (existing) continue;

    events.push({
      transaction_hash: tx.hash,
      token_address: tx.token_address,
      token_symbol: tx.token_symbol,
      from_address: tx.from,
      to_address: DEPOSIT_ADDRESS,
      amount: tx.amount,
      block_number: tx.block_number || 0,
      network: body.network,
      webhook_source: body.source || 'generic',
      confirmed: true
    });
  }

  return events;
}

// ============================================================
// Transaction Matching (same as blockchain-monitor)
// ============================================================

async function matchTransactionToRequest(event: any): Promise<void> {
  try {
    const networkUpper = event.network.toUpperCase();
    const tokenWithNetwork = `${event.token_symbol}-${networkUpper}`;

    const { data: offrampMatches } = await supabase
      .from('offramp_requests')
      .select('id, amount, token, status, reference_id')
      .in('status', ['pending_payment'])
      .or(`token.eq.${tokenWithNetwork},token.eq.${event.token_symbol}`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (offrampMatches && offrampMatches.length > 0) {
      let bestMatch = null;
      let bestDiff = Infinity;

      for (const req of offrampMatches) {
        const diff = Math.abs(req.amount - event.amount);
        const tolerance = req.amount * 0.02;
        if (diff < tolerance && diff < bestDiff) {
          bestMatch = req;
          bestDiff = diff;
        }
      }

      if (bestMatch) {
        console.log(`[WEBHOOK] Matched tx to offramp ${bestMatch.reference_id}`);

        await supabase
          .from('offramp_requests')
          .update({
            status: 'received',
            transaction_hash: event.transaction_hash,
          })
          .eq('id', bestMatch.id);

        await supabase
          .from('blockchain_events')
          .update({
            offramp_request_id: bestMatch.id,
            matched_request_type: 'offramp',
            matched_at: new Date().toISOString()
          })
          .eq('transaction_hash', event.transaction_hash)
          .eq('network', event.network);

        return;
      }
    }

    console.log(`[WEBHOOK] No match for tx ${event.transaction_hash}`);
  } catch (error) {
    console.error('Error matching transaction:', error);
  }
}

// ============================================================
// Main Handler
// ============================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    let events: any[] = [];
    let webhookType = 'unknown';

    console.log('=== BLOCKCHAIN WEBHOOK RECEIVED ===');
    console.log('Body keys:', Object.keys(body));

    // Detect webhook type
    if (body.webhookId && body.event?.activity) {
      // Alchemy webhook
      webhookType = 'alchemy';
      console.log('Processing Alchemy webhook');
      events = await processAlchemyWebhook(body);
    } else if (body.chainId && body.erc20Transfers) {
      // Moralis webhook
      webhookType = 'moralis';
      console.log('Processing Moralis webhook');
      events = await processMoralisWebhook(body);
    } else if (body.source && body.network && body.transactions) {
      // Generic webhook
      webhookType = 'generic';
      console.log('Processing generic webhook');
      events = await processGenericWebhook(body);
    } else {
      console.log('Unknown webhook format, raw body:', JSON.stringify(body).slice(0, 500));
      return new Response(JSON.stringify({
        success: false,
        error: 'Unknown webhook format'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert events
    if (events.length > 0) {
      console.log(`Inserting ${events.length} events from ${webhookType} webhook`);

      const { error: insertError } = await supabase
        .from('blockchain_events')
        .insert(events);

      if (insertError) {
        console.error('Insert error:', insertError);
      } else {
        // Match transactions to pending requests
        for (const event of events) {
          await matchTransactionToRequest(event);
        }
      }
    }

    console.log(`=== WEBHOOK PROCESSED: ${events.length} new events from ${webhookType} ===`);

    return new Response(JSON.stringify({
      success: true,
      webhook_type: webhookType,
      events_processed: events.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
