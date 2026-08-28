import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !publishableKey || !secretKey) {
  console.error("Faltan variables de entorno de Supabase en .env.local");
  process.exit(1);
}

async function checkKey(label, key) {
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await client
    .from("__connection_check__")
    .select("*")
    .limit(1);

  // PGRST205/42P01 = tabla no existe: la conexión y la autenticación funcionan.
  if (!error || error.code === "PGRST205" || error.code === "42P01") {
    console.log(`OK  [${label}] conexión y autenticación válidas contra ${url}`);
    return true;
  }

  console.error(`FAIL [${label}] ${error.code ?? ""} ${error.message}`);
  return false;
}

const results = await Promise.all([
  checkKey("publishable", publishableKey),
  checkKey("secret", secretKey),
]);

process.exit(results.every(Boolean) ? 0 : 1);
