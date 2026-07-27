import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMyTransactions from "./tools/list-my-transactions";
import getTransaction from "./tools/get-transaction";
import createOnramp from "./tools/create-onramp";
import createOfframp from "./tools/create-offramp";
import getExchangeRate from "./tools/get-exchange-rate";

// Direct Supabase host (never the .lovable.cloud proxy). Built from the project
// ref at build time so the entry stays import-safe.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "sikapay-mcp",
  title: "SikaPay",
  version: "0.1.0",
  instructions:
    "Tools for SikaPay: convert stablecoins (USDC/USDT) to Mobile Money XOF (offramp) or Mobile Money to stablecoins (onramp). Use `get_exchange_rate` to fetch the current USD/XOF rate, `list_my_transactions` and `get_transaction` to read the signed-in user's transactions, and `create_onramp_request` / `create_offramp_request` to open a new transaction. All write tools act on behalf of the signed-in SikaPay user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getExchangeRate,
    listMyTransactions,
    getTransaction,
    createOnramp,
    createOfframp,
  ],
});
