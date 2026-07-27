import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "get_exchange_rate",
  title: "Get exchange rate",
  description: "Get the current USD/XOF exchange rate used by SikaPay (includes the platform margin).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!;
    const res = await fetch(`${url}/functions/v1/get-exchange-rate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: "{}",
    });
    const body = await res.json();
    if (!res.ok || !body?.success) {
      return {
        content: [{ type: "text", text: body?.error ?? "Failed to fetch exchange rate" }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(body.data) }],
      structuredContent: body.data,
    };
  },
});
