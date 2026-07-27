import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "create_offramp_request",
  title: "Create offramp request",
  description:
    "Create a new offramp request (stablecoin -> Mobile Money XOF) on behalf of the signed-in user. Delegates to the create-offramp-request edge function, then tags the created row with the user's id.",
  inputSchema: {
    amount: z.number().positive().describe("Stablecoin amount the user will send."),
    token: z.enum(["USDC", "USDT"]),
    network: z.string().optional(),
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
    const res = await fetch(`${url}/functions/v1/create-offramp-request`, {
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
        content: [{ type: "text", text: body?.details || body?.error || "Failed to create offramp request" }],
        isError: true,
      };
    }

    const service = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    if (body.data?.id) {
      await service.from("offramp_requests").update({ user_id: ctx.getUserId() }).eq("id", body.data.id);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(body.data) }],
      structuredContent: body.data,
    };
  },
});
