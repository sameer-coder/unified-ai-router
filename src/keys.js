import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const KEYS_FILE = resolve("keys.json");

function load() {
  if (!existsSync(KEYS_FILE)) return {};
  try {
    return JSON.parse(readFileSync(KEYS_FILE, "utf8"));
  } catch {
    return {};
  }
}

function save(data) {
  writeFileSync(KEYS_FILE, JSON.stringify(data, null, 2), "utf8");
}

export function getKey(providerId) {
  const data = load();
  return data[providerId] ?? null;
}

export function setKey(providerId, key) {
  const data = load();
  data[providerId] = key;
  save(data);
}

export function deleteKey(providerId) {
  const data = load();
  delete data[providerId];
  save(data);
}

export function getAllKeys() {
  return load();
}

export function hasKey(providerId) {
  return getKey(providerId) !== null;
}
