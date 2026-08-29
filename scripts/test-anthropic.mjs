import { readFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";

function loadEnvLocal() {
  const content = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const client = new Anthropic();

const TOOLS = [
  {
    name: "get_dummy_weather",
    description: "Devuelve un clima ficticio para probar el flujo de tool use.",
    input_schema: {
      type: "object",
      properties: { city: { type: "string" } },
      required: ["city"],
    },
  },
];

async function main() {
  const messages = [
    {
      role: "user",
      content: "Usa la herramienta get_dummy_weather para Bogotá y luego dime en una frase corta qué tal está.",
    },
  ];

  let fullText = "";

  for (let i = 0; i < 3; i++) {
    const stream = client.messages.stream({
      model: "claude-sonnet-5",
      max_tokens: 512,
      tools: TOOLS,
      messages,
    });

    stream.on("text", (delta) => {
      fullText += delta;
      process.stdout.write(delta);
    });

    const message = await stream.finalMessage();
    console.error(`\n[stop_reason=${message.stop_reason}]`);

    if (message.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: message.content });
      const toolUses = message.content.filter((b) => b.type === "tool_use");
      const toolResults = [];
      for (const t of toolUses) {
        console.error(`[tool_use] ${t.name}(${JSON.stringify(t.input)})`);
        toolResults.push({
          type: "tool_result",
          tool_use_id: t.id,
          content: JSON.stringify({ tempC: 18, condition: "nublado" }),
        });
      }
      messages.push({ role: "user", content: toolResults });
      continue;
    }
    break;
  }

  console.error("\n\n--- FULL TEXT ---");
  console.error(fullText);
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
