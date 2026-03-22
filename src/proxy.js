import { getKey } from "./keys.js";
import { getProvider } from "./providers.js";

function getBaseUrl(provider) {
  if (provider.getBaseUrl) {
    const keys = getKey(provider.id);
    const extra = keys?.extra ?? {};
    return provider.getBaseUrl(extra);
  }
  return provider.baseUrl;
}

function getApiKey(provider) {
  const stored = getKey(provider.id);
  if (!stored) return null;
  return typeof stored === "object" ? stored.key : stored;
}

export async function proxyRequest(providerId, path, body, reqHeaders) {
  const provider = getProvider(providerId);
  if (!provider) {
    return { error: `Unknown provider: ${providerId}`, status: 400 };
  }

  const apiKey = getApiKey(provider);
  if (!apiKey) {
    return { error: `No API key set for provider: ${providerId}`, status: 401 };
  }

  const baseUrl = getBaseUrl(provider);
  if (!baseUrl) {
    return { error: `Cannot resolve base URL for provider: ${providerId}`, status: 500 };
  }

  const url = `${baseUrl}${path}`;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  if (providerId === "openrouter") {
    headers["HTTP-Referer"] = reqHeaders?.["http-referer"] ?? "https://llm-router";
    headers["X-Title"] = "Free LLM Router";
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return { data, status: response.status };
  } catch (err) {
    return { error: err.message, status: 502 };
  }
}

export async function proxyGet(providerId, path) {
  const provider = getProvider(providerId);
  if (!provider) {
    return { error: `Unknown provider: ${providerId}`, status: 400 };
  }

  const apiKey = getApiKey(provider);
  if (!apiKey) {
    return { error: `No API key set for provider: ${providerId}`, status: 401 };
  }

  const baseUrl = getBaseUrl(provider);
  const url = `${baseUrl}${path}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const data = await response.json();
    return { data, status: response.status };
  } catch (err) {
    return { error: err.message, status: 502 };
  }
}
