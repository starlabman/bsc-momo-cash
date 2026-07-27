import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "create_onramp_request",
  title: "Create onramp request",
  description:
    "Create a new onramp request (Mobile Money XOF -> stablecoin) on behalf of the signed-in user. Delegates to the create-onramp-request edge function, then tags the created row with the user's id.",
  inputSchema: {
    xofAmount: z.number().min(100).max(600000),
    token: z.enum(["USDC", "USDT"]),
    network: z.string().describe("Blockchain network, e.g. base, bsc, ethereum, polygon, solana."),
    recipientAddress: z.string().min(1).max(64).describe("Destination wallet address."),
    momoNumber: z.string().min(8).max(20),
    momoProvider: z.string().optional(),
    countryId: z.string().uuid().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!;
    const res = await fetch(`${url}/functions/v1/create-onramp-request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(input),
    });
    const body = await res.json();
    if (!res.ok || !body?.success) {
      return {
        content: [{ type: "text", text: body?.details || body?.error || "Failed to create onramp request" }],
        isError: true,
      };
    }

    // Tag the newly created row with the signed-in user's id so it appears in list_my_transactions.
    const service = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    if (body.data?.id) {
      await service.from("onramp_requests").update({ user_id: ctx.getUserId() }).eq("id", body.data.id);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(body.data) }],
      structuredContent: body.data,
    };
  },
});
