import "dotenv/config";
import Fastify from "fastify";
import { listProviders, getProvider } from "./providers.js";
import { getKey, setKey, deleteKey, hasKey } from "./keys.js";
import { proxyRequest, proxyGet } from "./proxy.js";
import { getUsage } from "./usage.js";
import { selectModel, readPriorityList, writePriorityList } from "./selector.js";

const app = Fastify({ logger: true });

const PORT = process.env.PORT ?? 3000;
const HOST = "0.0.0.0";

app.get("/", async () => ({
  name: "Free LLM Router",
  version: "1.0.0",
  description: "A unified router for free LLM APIs",
  docs: {
    providers: "GET /providers",
    setKey: "POST /providers/:id/key  { key: '...' }",
    deleteKey: "DELETE /providers/:id/key",
    chat: "POST /v1/chat/completions  (x-provider header optional — auto-selects if omitted)",
    models: "GET /v1/models",
    priority: "GET /priority  |  PUT /priority  { models: ['groq/llama-3.3-70b-versatile', ...] }",
    usage: "GET /usage",
  },
}));

app.get("/providers", async () => {
  return listProviders().map((p) => ({
    id: p.id,
    name: p.name,
    baseUrl: p.baseUrl,
    models: p.models,
    rateLimits: p.rateLimits,
    region: p.region,
    keyEnv: p.keyEnv,
    extraEnv: p.extraEnv ?? null,
    hasKey: hasKey(p.id),
  }));
});

app.get("/providers/:id", async (req, reply) => {
  const provider = getProvider(req.params.id);
  if (!provider) return reply.status(404).send({ error: "Provider not found" });
  return {
    ...provider,
    hasKey: hasKey(provider.id),
  };
});

app.post("/providers/:id/key", async (req, reply) => {
  const provider = getProvider(req.params.id);
  if (!provider) return reply.status(404).send({ error: "Provider not found" });

  const { key, ...extra } = req.body ?? {};
  if (!key) return reply.status(400).send({ error: "Missing key in request body" });

  const value = Object.keys(extra).length > 0 ? { key, extra } : key;
  setKey(provider.id, value);

  return { success: true, provider: provider.id, message: "API key saved" };
});

app.delete("/providers/:id/key", async (req, reply) => {
  const provider = getProvider(req.params.id);
  if (!provider) return reply.status(404).send({ error: "Provider not found" });

  deleteKey(provider.id);
  return { success: true, provider: provider.id, message: "API key removed" };
});

app.get("/providers/:id/key", async (req, reply) => {
  const provider = getProvider(req.params.id);
  if (!provider) return reply.status(404).send({ error: "Provider not found" });

  const stored = getKey(provider.id);
  if (!stored) return reply.status(404).send({ error: "No key set for this provider" });

  const key = typeof stored === "object" ? stored.key : stored;
  const masked = key.slice(0, 6) + "..." + key.slice(-4);
  return { provider: provider.id, keyPreview: masked, hasKey: true };
});

app.post("/v1/chat/completions", async (req, reply) => {
  let providerId = req.headers["x-provider"];
  let body = req.body ?? {};

  if (!providerId && !body.model) {
    const selected = selectModel(req.log);
    if (!selected) {
      return reply.status(400).send({
        error: "No provider specified and no API keys are configured. Set a key with POST /providers/:id/key",
      });
    }
    providerId = selected.provider;
    body = { ...body, model: selected.model };
  } else if (!providerId) {
    return reply.status(400).send({
      error: "Missing x-provider header. Specify which provider to use, or omit both provider and model for auto-selection.",
    });
  }

  const { data, error, status } = await proxyRequest(providerId, "/chat/completions", body, req.headers);

  if (error) return reply.status(status).send({ error });
  return reply.status(status).send(data);
});

app.get("/priority", async () => {
  const lines = readPriorityList();
  return { models: lines };
});

app.put("/priority", async (req, reply) => {
  const { models } = req.body ?? {};
  if (!Array.isArray(models)) {
    return reply.status(400).send({ error: "Body must be { models: ['provider/model', ...] }" });
  }
  writePriorityList(models);
  return { success: true, models };
});

app.get("/usage", async () => {
  return getUsage();
});

app.get("/v1/models", async (req, reply) => {
  const providerId = req.headers["x-provider"];

  if (providerId) {
    const { data, error, status } = await proxyGet(providerId, "/models");
    if (error) return reply.status(status).send({ error });
    return reply.status(status).send(data);
  }

  const allModels = [];
  for (const p of listProviders()) {
    for (const model of p.models) {
      allModels.push({
        id: model,
        provider: p.id,
        providerName: p.name,
        hasKey: hasKey(p.id),
      });
    }
  }
  return { object: "list", data: allModels };
});

try {
  await app.listen({ port: Number(PORT), host: HOST });
  console.log(`Free LLM Router running on http://${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
