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
  name: "get_transaction",
  title: "Get transaction",
  description:
    "Fetch one SikaPay transaction by its reference id (OFF-XXXXXX or ONR-XXXXXX). Only returns a row if it belongs to the signed-in user.",
  inputSchema: {
    reference_id: z
      .string()
      .trim()
      .min(3)
      .describe("Transaction reference id, e.g. OFF-A1B2C3 or ONR-X9Y8Z7."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ reference_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    const ref = reference_id.trim().toUpperCase();
    const table = ref.startsWith("ONR") ? "onramp_requests" : "offramp_requests";
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("reference_id", ref)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    if (!data) {
      return {
        content: [{ type: "text", text: `No transaction ${ref} found for this user.` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { transaction: { ...data, type: table === "onramp_requests" ? "onramp" : "offramp" } },
    };
  },
});
