# Free LLM Router

A minimal Fastify service that acts as a unified router for all major free LLM APIs. All providers are OpenAI SDK-compatible, so you can switch between them by changing a single header.

## Supported Providers

| ID | Name | Notable Models | Rate Limits | Region |
|----|------|----------------|-------------|--------|
| `gemini` | Google Gemini | Gemini 2.5 Pro, Flash, Flash-Lite | 5–15 RPM, 100–1K RPD | US |
| `cohere` | Cohere | Command A, Command R+, Aya Expanse 32B | 20 RPM, 1K/mo | US |
| `mistral` | Mistral AI | Mistral Large/Small, Ministral 8B | 1 req/s, 1B tok/mo | EU |
| `zhipu` | Zhipu AI | GLM-4-Flash, GLM-4V-Flash | Undocumented | CN |
| `github` | GitHub Models | GPT-4o, Llama 3.3 70B, DeepSeek-R1 | 10–15 RPM, 50–150 RPD | US |
| `nvidia` | NVIDIA NIM | Llama 3.3 70B, Mistral Large, Qwen3 235B | 40 RPM | US |
| `groq` | Groq | Llama 3.3 70B, Llama 4 Scout, Kimi K2 | 30 RPM, 14,400 RPD | US |
| `cerebras` | Cerebras | Llama 3.3 70B, Qwen3 235B, GPT-OSS-120B | 30 RPM, 14,400 RPD | US |
| `cloudflare` | Cloudflare Workers AI | Llama 3.3 70B, QwQ 32B | 10K neurons/day | US |
| `llm7` | LLM7.io | DeepSeek R1, Gemini Flash-Lite, Qwen2.5 Coder | 30 RPM | GB |
| `kluster` | Kluster AI | DeepSeek-R1, Llama 4 Maverick, Qwen3-235B | Undocumented | US |
| `openrouter` | OpenRouter | DeepSeek R1, Llama 3.3 70B, GPT-4o (free) | 20 RPM, 50 RPD | US |
| `huggingface` | Hugging Face | Llama 3.3 70B, Qwen2.5 72B, Mistral 7B | $0.10/mo credits | US |

## Getting Started

```bash
npm install
npm start
```

The server runs on port `3000`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Service info |
| GET | `/providers` | List all providers with key status |
| GET | `/providers/:id` | Get provider details |
| POST | `/providers/:id/key` | Set API key for a provider |
| GET | `/providers/:id/key` | Preview stored key (masked) |
| DELETE | `/providers/:id/key` | Remove a stored key |
| POST | `/v1/chat/completions` | Proxy a chat completion request |
| GET | `/v1/models` | List models (all providers or one via header) |
| GET | `/usage` | Monthly usage stats per provider |

## Usage

### List all providers

```bash
curl http://localhost:3000/providers
```

### List all models (across all providers)

```bash
curl http://localhost:3000/v1/models
```

### List models from a specific provider (fetched live from their API)

```bash
curl -H "x-provider: groq" http://localhost:3000/v1/models
```

### Set an API key

```bash
curl -X POST http://localhost:3000/providers/groq/key \
  -H "Content-Type: application/json" \
  -d '{"key": "gsk_your_key_here"}'
```

### Set a key for Cloudflare (requires an account ID too)

```bash
curl -X POST http://localhost:3000/providers/cloudflare/key \
  -H "Content-Type: application/json" \
  -d '{"key": "your-api-token", "accountId": "your-account-id"}'
```

### Preview a stored key

```bash
curl http://localhost:3000/providers/groq/key
```

### Remove a stored key

```bash
curl -X DELETE http://localhost:3000/providers/groq/key
```

### Send a chat completion

Use the `x-provider` header to specify which provider handles the request:

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "x-provider: groq" \
  -d '{
    "model": "llama-3.3-70b-versatile",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Check monthly usage

```bash
curl http://localhost:3000/usage
```

## Key Storage

API keys are saved to `keys.json` in the project root (gitignored). They persist across restarts. Keys are never logged or exposed — the preview endpoint shows only a masked version (e.g. `gsk_te...6789`).

## Notes

- All providers use the OpenAI-compatible chat completions format.
- The `x-provider` header is required for `/v1/chat/completions`.
- Cloudflare requires both a `key` and an `accountId` when setting credentials.
- Google Gemini's free tier is not available in the EU, UK, or Switzerland.
