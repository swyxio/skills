import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const PORT = parseInt(process.env.PORT ?? "3456");
const RUNS_DIR = join(import.meta.dir, ".runs");
const DIST_DIR = join(import.meta.dir, "dist");
const SRC_DIR = join(import.meta.dir, "src");

await mkdir(RUNS_DIR, { recursive: true });

const PROVIDER_KEYS: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  custom: "CUSTOM_API_KEY",
};

const PROVIDER_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
  openrouter: "https://openrouter.ai/api/v1",
  ollama: "http://localhost:11434/v1",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleLLMProxy(req: Request): Promise<Response> {
  const body = await req.json();
  const { provider, model, systemPrompt, userMessage, temperature, maxTokens, customBaseUrl } = body;

  const baseUrl = provider === "custom" ? customBaseUrl : PROVIDER_URLS[provider];
  if (!baseUrl) return json({ error: `Unknown provider: ${provider}` }, 400);

  const apiKey = provider === "ollama" ? "ollama" : process.env[PROVIDER_KEYS[provider] ?? ""] ?? "";
  if (!apiKey && provider !== "ollama") {
    return json({ error: `API key not set for ${provider} (${PROVIDER_KEYS[provider]})` }, 400);
  }

  try {
    let content: string;

    if (provider === "anthropic") {
      const resp = await fetch(`${baseUrl}/messages`, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: temperature ?? 0.3,
          max_tokens: maxTokens ?? 4096,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
        }),
      });
      const data = await resp.json();
      if (data.error) return json({ error: data.error.message ?? JSON.stringify(data.error) }, 400);
      content = data.content?.[0]?.text ?? "";
    } else {
      const headers: Record<string, string> = {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      };
      if (provider === "openrouter") {
        headers["HTTP-Referer"] = "http://localhost:3000";
        headers["X-Title"] = "Summarize Playground";
      }

      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          temperature: temperature ?? 0.3,
          max_tokens: maxTokens ?? 4096,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        }),
      });
      const data = await resp.json();
      if (data.error) return json({ error: data.error.message ?? JSON.stringify(data.error) }, 400);
      content = data.choices?.[0]?.message?.content ?? "";
    }

    return json({ content });
  } catch (err: any) {
    return json({ error: err.message ?? "LLM call failed" }, 500);
  }
}

async function handleListRuns(): Promise<Response> {
  try {
    const files = await readdir(RUNS_DIR);
    const runs = [];
    for (const f of files.filter((f) => f.endsWith(".json")).sort().reverse()) {
      const data = JSON.parse(await readFile(join(RUNS_DIR, f), "utf-8"));
      runs.push({
        id: data.id,
        timestamp: data.timestamp,
        format: data.config?.format ?? "unknown",
        model: data.config?.model ?? "unknown",
      });
    }
    return json(runs);
  } catch {
    return json([]);
  }
}

async function handleGetRun(id: string): Promise<Response> {
  try {
    const files = await readdir(RUNS_DIR);
    const match = files.find((f) => f.includes(id));
    if (!match) return json({ error: "Run not found" }, 404);
    const data = JSON.parse(await readFile(join(RUNS_DIR, match), "utf-8"));
    return json(data);
  } catch {
    return json({ error: "Run not found" }, 404);
  }
}

async function handleSaveRun(req: Request): Promise<Response> {
  const run = await req.json();
  const filename = `${run.timestamp.replace(/[:.]/g, "-")}_${run.id.slice(0, 8)}.json`;
  await writeFile(join(RUNS_DIR, filename), JSON.stringify(run, null, 2));
  return json({ ok: true });
}

function handleGetKeys(): Response {
  const keys: Record<string, boolean | "unknown"> = {};
  for (const [provider, envVar] of Object.entries(PROVIDER_KEYS)) {
    keys[provider] = envVar ? !!process.env[envVar] : false;
  }
  keys.ollama = "unknown";
  return json(keys);
}

function getMimeType(path: string): string {
  if (path.endsWith(".html")) return "text/html";
  if (path.endsWith(".js")) return "application/javascript";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".json")) return "application/json";
  if (path.endsWith(".md")) return "text/markdown";
  if (path.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // API routes
    if (path === "/api/llm" && req.method === "POST") return handleLLMProxy(req);
    if (path === "/api/runs" && req.method === "GET") return handleListRuns();
    if (path === "/api/runs" && req.method === "POST") return handleSaveRun(req);
    if (path.startsWith("/api/runs/") && req.method === "GET") return handleGetRun(path.split("/").pop()!);
    if (path === "/api/keys" && req.method === "GET") return handleGetKeys();

    // Sample transcript
    if (path === "/sample-transcript.md") {
      const fp = join(import.meta.dir, "sample-transcript.md");
      if (existsSync(fp)) return new Response(Bun.file(fp));
    }

    // Static files from dist/
    let filePath = path === "/" ? "/index.html" : path;
    const distFile = join(DIST_DIR, filePath);
    if (existsSync(distFile)) {
      return new Response(Bun.file(distFile), {
        headers: { "Content-Type": getMimeType(distFile) },
      });
    }

    // Fallback to src/index.html for SPA
    const indexFile = join(DIST_DIR, "index.html");
    if (existsSync(indexFile)) {
      return new Response(Bun.file(indexFile), {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`Playground running at http://localhost:${PORT}`);
