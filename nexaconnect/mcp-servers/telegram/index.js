import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import https from "node:https";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN environment variable is required");
  process.exit(1);
}

const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Track the last update_id so get_updates can avoid returning duplicates
let lastUpdateId = 0;

/**
 * Make an HTTPS request to the Telegram Bot API.
 * Returns a parsed JSON response.
 */
function telegramApi(method, params = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}/${method}`);
    const body = JSON.stringify(params);

    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (!parsed.ok) {
              reject(new Error(`Telegram API error: ${parsed.description || JSON.stringify(parsed)}`));
            } else {
              resolve(parsed.result);
            }
          } catch (e) {
            reject(new Error(`Failed to parse Telegram response: ${data}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ── MCP Server ──────────────────────────────────────────────────────────────

const server = new McpServer({
  name: "telegram",
  version: "1.0.0",
});

// ── Tool: send_message ──────────────────────────────────────────────────────

server.tool(
  "send_message",
  "Send a text message to a Telegram chat. You need the numeric chat_id (use get_updates first to discover chat IDs from incoming messages).",
  {
    chat_id: z.union([z.string(), z.number()]).describe("The target chat ID (numeric) or @channel_username"),
    text: z.string().describe("The message text to send"),
    parse_mode: z
      .enum(["HTML", "Markdown", "MarkdownV2"])
      .optional()
      .describe("Optional parse mode for formatting"),
  },
  async ({ chat_id, text, parse_mode }) => {
    try {
      const params = { chat_id, text };
      if (parse_mode) params.parse_mode = parse_mode;
      const result = await telegramApi("sendMessage", params);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ── Tool: get_updates ───────────────────────────────────────────────────────

server.tool(
  "get_updates",
  "Poll for new incoming messages/updates from Telegram. Returns new messages since the last poll. Call this periodically to check for replies.",
  {
    timeout: z
      .number()
      .optional()
      .default(5)
      .describe("Long-poll timeout in seconds (default 5, max 50)"),
    limit: z
      .number()
      .optional()
      .default(20)
      .describe("Max number of updates to return (1-100, default 20)"),
  },
  async ({ timeout, limit }) => {
    try {
      const params = {
        timeout: Math.min(timeout ?? 5, 50),
        limit: Math.min(limit ?? 20, 100),
        allowed_updates: ["message"],
      };
      // Only fetch updates newer than the last one we saw
      if (lastUpdateId > 0) {
        params.offset = lastUpdateId + 1;
      }

      const updates = await telegramApi("getUpdates", params);

      // Advance the offset so we don't see the same updates again
      if (Array.isArray(updates) && updates.length > 0) {
        lastUpdateId = updates[updates.length - 1].update_id;
      }

      // Build a human-friendly summary alongside the raw data
      const summary = (updates || []).map((u) => {
        const msg = u.message;
        if (!msg) return { update_id: u.update_id, type: "unknown" };
        return {
          update_id: u.update_id,
          chat_id: msg.chat?.id,
          chat_title: msg.chat?.title || msg.chat?.first_name || "DM",
          from: msg.from
            ? `${msg.from.first_name || ""} ${msg.from.last_name || ""}`.trim()
            : "unknown",
          from_username: msg.from?.username || null,
          date: new Date(msg.date * 1000).toISOString(),
          text: msg.text || "(non-text message)",
        };
      });

      return {
        content: [
          {
            type: "text",
            text:
              summary.length === 0
                ? "No new messages."
                : JSON.stringify(summary, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ── Tool: get_chat_info ─────────────────────────────────────────────────────

server.tool(
  "get_chat_info",
  "Get information about a Telegram chat (group, channel, or user DM) by its chat_id.",
  {
    chat_id: z.union([z.string(), z.number()]).describe("The chat ID or @username to look up"),
  },
  async ({ chat_id }) => {
    try {
      const result = await telegramApi("getChat", { chat_id });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ── Start ───────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
