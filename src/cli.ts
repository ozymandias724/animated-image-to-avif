/// <reference types="node" />

import { convert } from "./convert";

import type { PresetName } from "./presets";
import type { LogLevel } from "./log";
import { formatBytes, formatDuration, formatReduction } from "./format";

// Simple CLI adapter
// Thin wrapper around the conversion engine

const input = process.argv[2];

const output = process.argv[3];

if (!input || !output) {
  console.error("Usage: bun run src/cli.ts <input> <output> [options]");

  process.exit(1);
}

// Numeric flag helper
function getNumberFlag(flag: string, fallback: number) {
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return fallback;
  }

  const value = Number(process.argv[index + 1]);

  if (Number.isNaN(value)) {
    return fallback;
  }

  return value;
}

// String flag helper
function getStringFlag(flag: string) {
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

const preserveAlpha = !process.argv.includes("--no-alpha");

let logLevel: LogLevel = "verbose";

if (process.argv.includes("--debug")) {
  logLevel = "debug";
}

if (process.argv.includes("--quiet")) {
  logLevel = "quiet";
}

const quality = getNumberFlag("--quality", 50);

const speed = getNumberFlag("--speed", 8);

// Config validation occurs downstream
const preset = getStringFlag("--preset") as PresetName | undefined;

// Execute conversion engine
const result = await convert({
  input,
  output,

  preset,

  quality,
  speed,

  preserveAlpha,
  logLevel,
});

console.log("\nConversion complete.\n");

// CLI consumes structured engine results
console.log({
  frames: result.sourceFrameCount,

  inputSize: formatBytes(result.inputSize),

  outputSize: formatBytes(result.outputSize),

  reduction: formatReduction(result.reductionPercent),

  duration: formatDuration(result.durationMs),
});
