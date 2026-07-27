import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "list_my_transactions",
  title: "List my transactions",
  description:
    "List the signed-in user's SikaPay transactions (both offramp and onramp), most recent first.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Max rows per type (default 20)."),
    type: z
      .enum(["all", "offramp", "onramp"])
      .optional()
      .describe("Filter by transaction type. Defaults to 'all'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, type }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    const cap = limit ?? 20;
    const kind = type ?? "all";

    const results: any[] = [];
    if (kind === "all" || kind === "offramp") {
      const { data, error } = await supabase
        .from("offramp_requests")
        .select(
          "id, reference_id, status, amount, xof_amount, usd_amount, token, momo_number, momo_provider, exchange_rate, created_at",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(cap);
      if (error) {
        return { content: [{ type: "text", text: error.message }], isError: true };
      }
      results.push(...(data ?? []).map((r) => ({ ...r, type: "offramp" })));
    }
    if (kind === "all" || kind === "onramp") {
      const { data, error } = await supabase
        .from("onramp_requests")
        .select(
          "id, reference_id, status, crypto_amount, xof_amount, usd_amount, token, momo_number, momo_provider, recipient_address, exchange_rate, created_at",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(cap);
      if (error) {
        return { content: [{ type: "text", text: error.message }], isError: true };
      }
      results.push(...(data ?? []).map((r) => ({ ...r, type: "onramp" })));
    }
    results.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return {
      content: [{ type: "text", text: JSON.stringify(results) }],
      structuredContent: { transactions: results },
    };
  },
});
