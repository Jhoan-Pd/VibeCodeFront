#!/usr/bin/env node
/**
 * The backend repository owns the API contract (proto/). This script copies it here and regenerates
 * the TypeScript client code, so both sides always build from the same .proto files.
 *
 *   npm run proto:sync                      # from a sibling checkout ../vibedecoder-backend, or GitHub main
 *   BACKEND_PROTO_REF=v2.1.0 npm run proto:sync
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const FILES = [
  "grpc/health/v1/health.proto",
  "vibedecoder/v1/common.proto",
  "vibedecoder/v1/analysis.proto",
  "vibedecoder/v1/quiz.proto",
  "vibedecoder/v1/chat.proto",
  "vibedecoder/v1/share.proto",
  "vibedecoder/v1/progress.proto",
  "vibedecoder/v1/user.proto",
  "vibedecoder/v1/gist.proto",
];
const sibling = path.resolve("..", "vibedecoder-backend", "proto");
const ref = process.env.BACKEND_PROTO_REF ?? "main";
const remote = `https://raw.githubusercontent.com/Jhoan-Pd/vibedecoder-backend/${ref}/proto`;

for (const file of FILES) {
  const target = path.join("proto", file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.existsSync(sibling)) {
    fs.copyFileSync(path.join(sibling, file), target);
  } else {
    const res = await fetch(`${remote}/${file}`);
    if (!res.ok) throw new Error(`Could not download ${file}: HTTP ${res.status}`);
    fs.writeFileSync(target, await res.text());
  }
}
console.log(`Synced ${FILES.length} proto files from ${fs.existsSync(sibling) ? sibling : remote}`);
execSync("npx buf generate", { stdio: "inherit" });
