import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const USAGE_FILE = resolve("usage.json");

function currentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function load() {
  if (!existsSync(USAGE_FILE)) return { month: currentMonth(), providers: {} };
  try {
    return JSON.parse(readFileSync(USAGE_FILE, "utf8"));
  } catch {
    return { month: currentMonth(), providers: {} };
  }
}

function save(data) {
  writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2), "utf8");
}

export function recordUsage(providerId, usage) {
  const data = load();
  const month = currentMonth();

  if (data.month !== month) {
    data.month = month;
    data.providers = {};
  }

  if (!data.providers[providerId]) {
    data.providers[providerId] = {
      requests: 0,
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    };
  }

  data.providers[providerId].requests += 1;

  if (usage) {
    data.providers[providerId].prompt_tokens += usage.prompt_tokens ?? 0;
    data.providers[providerId].completion_tokens += usage.completion_tokens ?? 0;
    data.providers[providerId].total_tokens += usage.total_tokens ?? 0;
  }

  save(data);
}

export function getUsage() {
  const data = load();
  const month = currentMonth();

  if (data.month !== month) {
    return { month, providers: {} };
  }

  return { month: data.month, providers: data.providers };
}
