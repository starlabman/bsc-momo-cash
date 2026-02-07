import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// ERC-20 Transfer event signature: Transfer(address,address,uint256)
const TRANSFER_EVENT_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// Deposit address (same across all EVM networks)
const DEPOSIT_ADDRESS = '0xf249F24182CdE7bAd264B60Ed38727Fd3674FE6A';
const DEPOSIT_ADDRESS_PADDED = '0x000000000000000000000000' + DEPOSIT_ADDRESS.slice(2).toLowerCase();

// Network configurations
const EVM_NETWORKS: Record<string, {
  rpcUrl: string;
  tokens: Record<string, { address: string; decimals: number; }>;
  blockTime: number; // average block time in seconds
  maxBlockRange: number; // max blocks to scan per call
}> = {
  base: {
    rpcUrl: 'https://mainnet.base.org',
    tokens: {
      'USDC': { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
      'USDT': { address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', decimals: 6 }
    },
    blockTime: 2,
    maxBlockRange: 2000
  },
  bsc: {
    rpcUrl: 'https://bsc-rpc.publicnode.com',
    tokens: {
      'USDC': { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
      'USDT': { address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 }
    },
    blockTime: 3,
    maxBlockRange: 1000
  },
  ethereum: {
    rpcUrl: 'https://eth.llamarpc.com',
    tokens: {
      'USDC': { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
      'USDT': { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 }
    },
    blockTime: 12,
    maxBlockRange: 2000
  },
  arbitrum: {
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    tokens: {
      'USDC': { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
      'USDT': { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 }
    },
    blockTime: 1,
    maxBlockRange: 5000
  },
  optimism: {
    rpcUrl: 'https://mainnet.optimism.io',
    tokens: {
      'USDC': { address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6 },
      'USDT': { address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6 }
    },
    blockTime: 2,
    maxBlockRange: 2000
  },
  polygon: {
    rpcUrl: 'https://polygon-bor-rpc.publicnode.com',
    tokens: {
      'USDC': { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
      'USDT': { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 }
    },
    blockTime: 2,
    maxBlockRange: 1000
  },
  avalanche: {
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    tokens: {
      'USDC': { address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', decimals: 6 },
      'USDT': { address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', decimals: 6 }
    },
    blockTime: 2,
    maxBlockRange: 2048
  },
  lisk: {
    rpcUrl: 'https://rpc.api.lisk.com',
    tokens: {
      'USDC': { address: '0xF242275d3a6527d877f2c927a82D9b057609cc71', decimals: 6 },
      'USDT': { address: '0x05D032ac25d322df992303dCa074EE7392C117b9', decimals: 6 }
    },
    blockTime: 2,
    maxBlockRange: 2000
  }
};

// ============================================================
// RPC Helpers
// ============================================================

async function rpcCall(rpcUrl: string, method: string, params: any[]): Promise<any> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });

  if (!response.ok) {
    throw new Error(`RPC call failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  if (result.error) {
    throw new Error(`RPC error: ${result.error.message || JSON.stringify(result.error)}`);
  }

  return result.result;
}

async function getLatestBlock(rpcUrl: string): Promise<number> {
  const hex = await rpcCall(rpcUrl, 'eth_blockNumber', []);
  return parseInt(hex, 16);
}

async function getTransferLogs(
  rpcUrl: string,
  tokenAddresses: string[],
  fromBlock: number,
  toBlock: number
): Promise<any[]> {
  const logs = await rpcCall(rpcUrl, 'eth_getLogs', [{
    fromBlock: '0x' + fromBlock.toString(16),
    toBlock: '0x' + toBlock.toString(16),
    address: tokenAddresses,
    topics: [
      TRANSFER_EVENT_TOPIC,
      null, // from address (any)
      DEPOSIT_ADDRESS_PADDED // to our deposit address
    ]
  }]);
  return logs || [];
}

function parseTransferLog(log: any, network: string, tokens: Record<string, { address: string; decimals: number }>): {
  transactionHash: string;
  tokenAddress: string;
  tokenSymbol: string;
  fromAddress: string;
  amount: number;
  blockNumber: number;
  network: string;
} | null {
  try {
    const tokenAddress = log.address.toLowerCase();
    let tokenSymbol = 'UNKNOWN';
    let decimals = 18;

    for (const [symbol, config] of Object.entries(tokens)) {
      if (config.address.toLowerCase() === tokenAddress) {
        tokenSymbol = symbol;
        decimals = config.decimals;
        break;
      }
    }

    if (tokenSymbol === 'UNKNOWN') return null;

    const fromAddress = '0x' + log.topics[1].slice(26);
    const rawAmount = BigInt(log.data);
    const amount = Number(rawAmount) / Math.pow(10, decimals);

    return {
      transactionHash: log.transactionHash,
      tokenAddress: log.address,
      tokenSymbol,
      fromAddress,
      amount,
      blockNumber: parseInt(log.blockNumber, 16),
      network
    };
  } catch (e) {
    console.error(`Error parsing log on ${network}:`, e);
    return null;
  }
}

// ============================================================
// Solana SPL Token monitoring
// ============================================================

const SOLANA_DEPOSIT_ADDRESS = 'Fq9sgX7UHqEEwpVMu7UKjpstQGcf1JD3kPnUTYRbEdcZ';

async function scanSolana(): Promise<any[]> {
  const rpcUrl = 'https://api.mainnet-beta.solana.com';
  const events: any[] = [];

  try {
    // Get recent signatures for the deposit address
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [
          SOLANA_DEPOSIT_ADDRESS,
          { limit: 20 }
        ]
      })
    });

    if (!response.ok) {
      console.error('Solana RPC error:', response.status);
      return events;
    }

    const result = await response.json();
    if (result.error) {
      console.error('Solana RPC error:', result.error);
      return events;
    }

    const signatures = result.result || [];
    
    for (const sig of signatures) {
      if (sig.err) continue; // Skip failed transactions

      // Check if we already processed this transaction
      const { data: existing } = await supabase
        .from('blockchain_events')
        .select('id')
        .eq('transaction_hash', sig.signature)
        .eq('network', 'solana')
        .maybeSingle();

      if (existing) continue;

      // Get transaction details
      const txResponse = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTransaction',
          params: [sig.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]
        })
      });

      if (!txResponse.ok) continue;

      const txResult = await txResponse.json();
      if (!txResult.result) continue;

      const tx = txResult.result;
      const instructions = tx.transaction?.message?.instructions || [];
      
      for (const ix of instructions) {
        if (ix.parsed?.type === 'transfer' || ix.parsed?.type === 'transferChecked') {
          const info = ix.parsed.info;
          if (info.destination === SOLANA_DEPOSIT_ADDRESS || info.mint) {
            const amount = info.tokenAmount?.uiAmount || info.amount / 1e6;
            events.push({
              transaction_hash: sig.signature,
              token_address: info.mint || 'SOL',
              token_symbol: 'USDC', // Assume USDC for now on Solana
              from_address: info.source || info.authority || 'unknown',
              to_address: SOLANA_DEPOSIT_ADDRESS,
              amount: amount,
              block_number: tx.slot,
              network: 'solana',
              webhook_source: 'polling',
              confirmed: true
            });
          }
        }
      }
    }
  } catch (e) {
    console.error('Error scanning Solana:', e);
  }

  return events;
}

// ============================================================
// EVM Network Scanner
// ============================================================

async function scanEvmNetwork(networkId: string): Promise<{ events: any[]; latestBlock: number; error?: string }> {
  const config = EVM_NETWORKS[networkId];
  if (!config) return { events: [], latestBlock: 0, error: `Unknown network: ${networkId}` };

  try {
    // Get scan state
    const { data: scanState } = await supabase
      .from('blockchain_scan_state')
      .select('*')
      .eq('network', networkId)
      .single();

    if (!scanState) {
      console.error(`No scan state for ${networkId}`);
      return { events: [], latestBlock: 0, error: 'No scan state' };
    }

    // Mark as scanning
    await supabase
      .from('blockchain_scan_state')
      .update({ is_scanning: true })
      .eq('network', networkId);

    const latestBlock = await getLatestBlock(config.rpcUrl);
    let fromBlock = scanState.last_scanned_block;

    // If first scan (block 0), start from recent blocks (last ~5 minutes)
    if (fromBlock === 0) {
      const blocksBack = Math.ceil(300 / config.blockTime); // ~5 minutes
      fromBlock = Math.max(1, latestBlock - blocksBack);
    }

    // Don't scan if we're already at the latest block
    if (fromBlock >= latestBlock) {
      await supabase
        .from('blockchain_scan_state')
        .update({ is_scanning: false, last_scan_at: new Date().toISOString() })
        .eq('network', networkId);
      return { events: [], latestBlock };
    }

    // Limit scan range
    const toBlock = Math.min(fromBlock + config.maxBlockRange, latestBlock);
    const tokenAddresses = Object.values(config.tokens).map(t => t.address);

    console.log(`[${networkId}] Scanning blocks ${fromBlock} → ${toBlock} (latest: ${latestBlock})`);

    const logs = await getTransferLogs(config.rpcUrl, tokenAddresses, fromBlock, toBlock);
    const events: any[] = [];

    for (const log of logs) {
      const parsed = parseTransferLog(log, networkId, config.tokens);
      if (!parsed) continue;

      // Check for duplicates
      const { data: existing } = await supabase
        .from('blockchain_events')
        .select('id')
        .eq('transaction_hash', parsed.transactionHash)
        .eq('network', networkId)
        .maybeSingle();

      if (existing) continue;

      events.push({
        transaction_hash: parsed.transactionHash,
        token_address: parsed.tokenAddress,
        token_symbol: parsed.tokenSymbol,
        from_address: parsed.fromAddress,
        to_address: DEPOSIT_ADDRESS,
        amount: parsed.amount,
        block_number: parsed.blockNumber,
        network: networkId,
        webhook_source: 'polling',
        confirmed: true
      });
    }

    // Update scan state
    await supabase
      .from('blockchain_scan_state')
      .update({
        last_scanned_block: toBlock,
        last_scan_at: new Date().toISOString(),
        is_scanning: false,
        error_count: 0,
        last_error: null
      })
      .eq('network', networkId);

    console.log(`[${networkId}] Found ${events.length} new transfers`);
    return { events, latestBlock: toBlock };

  } catch (error) {
    console.error(`[${networkId}] Scan error:`, error);

    // Update error state
    await supabase
      .from('blockchain_scan_state')
      .update({
        is_scanning: false,
        error_count: (await supabase.from('blockchain_scan_state').select('error_count').eq('network', networkId).single()).data?.error_count + 1 || 1,
        last_error: error.message || String(error)
      })
      .eq('network', networkId);

    return { events: [], latestBlock: 0, error: error.message };
  }
}

// ============================================================
// Transaction Matching
// ============================================================

async function matchTransactionToRequest(event: any): Promise<void> {
  try {
    const networkUpper = event.network.toUpperCase();
    const tokenWithNetwork = `${event.token_symbol}-${networkUpper}`;

    // Try to match with pending offramp requests
    const { data: offrampMatches } = await supabase
      .from('offramp_requests')
      .select('id, amount, token, status, reference_id')
      .in('status', ['pending_payment'])
      .or(`token.eq.${tokenWithNetwork},token.eq.${event.token_symbol}`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (offrampMatches && offrampMatches.length > 0) {
      // Find the best match (closest amount)
      let bestMatch = null;
      let bestDiff = Infinity;

      for (const req of offrampMatches) {
        const diff = Math.abs(req.amount - event.amount);
        const tolerance = req.amount * 0.02; // 2% tolerance
        if (diff < tolerance && diff < bestDiff) {
          bestMatch = req;
          bestDiff = diff;
        }
      }

      if (bestMatch) {
        console.log(`Matched blockchain event to offramp request ${bestMatch.reference_id}`);

        // Update the offramp request status to "received"
        await supabase
          .from('offramp_requests')
          .update({
            status: 'received',
            transaction_hash: event.transaction_hash,
          })
          .eq('id', bestMatch.id);

        // Link the blockchain event to the offramp request
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

    console.log(`No matching request found for tx ${event.transaction_hash} on ${event.network}`);
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
    console.log('=== BLOCKCHAIN MONITOR START ===');
    const startTime = Date.now();
    const allEvents: any[] = [];
    const scanResults: Record<string, any> = {};

    // Scan all EVM networks in parallel
    const evmNetworks = Object.keys(EVM_NETWORKS);
    const evmPromises = evmNetworks.map(async (networkId) => {
      const result = await scanEvmNetwork(networkId);
      scanResults[networkId] = {
        events: result.events.length,
        latestBlock: result.latestBlock,
        error: result.error
      };
      allEvents.push(...result.events);
    });

    // Scan Solana
    const solanaPromise = scanSolana().then(events => {
      scanResults['solana'] = { events: events.length };
      allEvents.push(...events);
    });

    // Wait for all scans
    await Promise.allSettled([...evmPromises, solanaPromise]);

    // Insert all new events
    if (allEvents.length > 0) {
      console.log(`Inserting ${allEvents.length} new blockchain events`);
      
      const { error: insertError } = await supabase
        .from('blockchain_events')
        .insert(allEvents);

      if (insertError) {
        console.error('Error inserting blockchain events:', insertError);
      } else {
        // Try to match each new event to pending requests
        for (const event of allEvents) {
          await matchTransactionToRequest(event);
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`=== BLOCKCHAIN MONITOR DONE in ${duration}ms ===`);
    console.log('Scan results:', JSON.stringify(scanResults));

    return new Response(JSON.stringify({
      success: true,
      duration_ms: duration,
      total_new_events: allEvents.length,
      networks: scanResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Blockchain monitor error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
