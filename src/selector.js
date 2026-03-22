import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { listProviders } from "./providers.js";
import { hasKey } from "./keys.js";

const PRIORITY_FILE = resolve("priority.txt");

export function readPriorityList() {
  if (!existsSync(PRIORITY_FILE)) return [];
  return readFileSync(PRIORITY_FILE, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

export function writePriorityList(lines) {
  writeFileSync(PRIORITY_FILE, lines.join("\n") + "\n", "utf8");
}

function parseEntry(line) {
  const slash = line.indexOf("/");
  if (slash === -1) return null;
  return { provider: line.slice(0, slash), model: line.slice(slash + 1) };
}

function providersWithKeys() {
  return listProviders().filter((p) => hasKey(p.id));
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function buildFallbackQueue(excludeSet) {
  const queue = [];
  const seen = new Set(excludeSet);

  for (const line of readPriorityList()) {
    const entry = parseEntry(line);
    if (!entry) continue;
    const key = `${entry.provider}/${entry.model}`;
    if (seen.has(key)) continue;
    if (!hasKey(entry.provider)) continue;
    queue.push(entry);
    seen.add(key);
  }

  const remaining = shuffle(providersWithKeys());
  for (const provider of remaining) {
    for (const model of provider.models) {
      const key = `${provider.id}/${model}`;
      if (seen.has(key)) continue;
      queue.push({ provider: provider.id, model });
      seen.add(key);
    }
  }

  return queue;
}

export function selectModel(log) {
  const lines = readPriorityList();

  if (lines.length > 0) {
    for (const line of lines) {
      const entry = parseEntry(line);
      if (!entry) continue;
      if (hasKey(entry.provider)) {
        log.info({ provider: entry.provider, model: entry.model, method: "priority" },
          `Auto-selected model from priority list: ${entry.provider}/${entry.model}`);
        return entry;
      }
    }
  }

  const available = providersWithKeys();
  if (available.length === 0) return null;

  const provider = available[Math.floor(Math.random() * available.length)];
  const model = provider.models[Math.floor(Math.random() * provider.models.length)];

  log.info({ provider: provider.id, model, method: "random" },
    `Auto-selected model randomly: ${provider.id}/${model}`);

  return { provider: provider.id, model };
}
