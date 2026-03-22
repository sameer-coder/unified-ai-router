# Free LLM Router

A clean, minimal Fastify service that acts as a unified router for all major free LLM APIs.

## Architecture

- **Runtime**: Node.js (ESM)
- **Framework**: Fastify
- **Key storage**: `keys.json` (local file, gitignored)
- **Port**: 3000 (console mode)

## Files

- `src/index.js` — Fastify server and route definitions
- `src/providers.js` — Provider registry with base URLs, models, and rate limits
- `src/keys.js` — Read/write API keys from `keys.json`
- `src/proxy.js` — Forward requests to provider APIs

## Supported Providers

All providers are OpenAI SDK-compatible.

| ID | Name | Region |
|----|------|--------|
| gemini | Google Gemini | US |
| cohere | Cohere | US |
| mistral | Mistral AI | EU |
| zhipu | Zhipu AI | CN |
| github | GitHub Models | US |
| nvidia | NVIDIA NIM | US |
| groq | Groq | US |
| cerebras | Cerebras | US |
| cloudflare | Cloudflare Workers AI | US |
| llm7 | LLM7.io | GB |
| kluster | Kluster AI | US |
| openrouter | OpenRouter | US |
| huggingface | Hugging Face | US |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Service info |
| GET | `/providers` | List all providers |
| GET | `/providers/:id` | Get provider details |
| POST | `/providers/:id/key` | Set API key |
| DELETE | `/providers/:id/key` | Remove API key |
| GET | `/providers/:id/key` | Preview stored key |
| POST | `/v1/chat/completions` | Proxy chat request |
| GET | `/v1/models` | List all/provider models |

## Usage

### Set an API key
```
POST /providers/groq/key
{ "key": "gsk_..." }
```

### Cloudflare (needs account ID too)
```
POST /providers/cloudflare/key
{ "key": "your-api-token", "accountId": "your-account-id" }
```

### Send a chat completion
```
POST /v1/chat/completions
x-provider: groq

{
  "model": "llama-3.3-70b-versatile",
  "messages": [{ "role": "user", "content": "Hello!" }]
}
```
