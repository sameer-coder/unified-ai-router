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
