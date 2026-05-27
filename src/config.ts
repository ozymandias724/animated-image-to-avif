import fs from "node:fs";
import path from "node:path";
import type { LogLevel } from "./log";
import type { ConversionProgressEvent } from "./progress";
import { PRESETS, type PresetName } from "./presets";

export type ResolvedConfig = {
  input: string;
  output: string;
  preset?: PresetName;
  quality: number;
  speed: number;
  preserveAlpha: boolean;
  logLevel: LogLevel;
};

export type ConvertOptions = {
  input: string;
  output: string;
  preset?: PresetName;
  quality?: number;
  speed?: number;
  preserveAlpha?: boolean;
  logLevel?: LogLevel;
  // Optional runtime progress events
  onProgress?: (event: ConversionProgressEvent) => void;
};

// Shared numeric range guard
function assertInRange(value: number, min: number, max: number, name: string) {
  if (value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}.`);
  }
}

// Validate filesystem assumptions
// before conversion begins
function validateFilesystem(input: string, output: string) {
  // Input file must exist
  if (!fs.existsSync(input)) {
    throw new Error(`Input file does not exist: ${input}`);
  }

  // Input path must be a file
  const inputStats = fs.statSync(input);

  if (!inputStats.isFile()) {
    throw new Error(`Input path is not a file: ${input}`);
  }

  // Output directory must exist
  const outputDirectory = path.dirname(output);

  if (!fs.existsSync(outputDirectory)) {
    throw new Error(`Output directory does not exist: ${outputDirectory}`);
  }

  // Prevent accidental overwrite-on-self
  const resolvedInput = path.resolve(input);

  const resolvedOutput = path.resolve(output);

  if (resolvedInput === resolvedOutput) {
    throw new Error("Input and output paths cannot be the same.");
  }
}

// Normalize and validate
// raw conversion configuration
export function resolveConfig(options: ConvertOptions): ResolvedConfig {
  const {
    input,
    output,
    preset,
    preserveAlpha = true,
    logLevel = "quiet",
  } = options;

  // Basic path validation
  if (!input.trim()) {
    throw new Error("Input path is required.");
  }

  if (!output.trim()) {
    throw new Error("Output path is required.");
  }

  // Validate filesystem assumptions early
  validateFilesystem(input, output);

  // Validate preset name before usage
  if (preset && !(preset in PRESETS)) {
    throw new Error(`Unknown preset: ${preset}`);
  }

  // Preset values become fallback defaults
  const presetConfig = preset ? PRESETS[preset] : undefined;

  // Explicit options override preset values
  const quality = options.quality ?? presetConfig?.quality ?? 50;

  const speed = options.speed ?? presetConfig?.speed ?? 8;

  // Guard against invalid encoder configuration
  assertInRange(quality, 0, 100, "Quality");

  assertInRange(speed, 0, 10, "Speed");

  // Downstream systems can trust this config
  return {
    input,
    output,

    preset,

    quality,
    speed,

    preserveAlpha,
    logLevel,
  };
}
