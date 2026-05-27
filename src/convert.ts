/// <reference types="node" />

import fs from "node:fs";
import { createLogger } from "./log";
import { resolveConfig } from "./config";
import { getAnimationMetadata } from "./metadata";
import { extractFrame } from "./frame";
import { buildY4MHeader, writeFrame, expandFrameTimings } from "./y4m";
import { createAvifEncoder } from "./avifenc";
import type { ConvertOptions } from "./config";
import type { AnimationFrame } from "./frame";
import type { ConversionResult } from "./result";

// Main animated image → AVIF conversion pipeline
export async function convert(
  options: ConvertOptions,
): Promise<ConversionResult> {
  // Normalize and validate config up front
  const { input, output, preset, quality, speed, preserveAlpha, logLevel } =
    resolveConfig(options);

  // Runtime callbacks are not configuration
  const { onProgress } = options;

  const logger = createLogger(logLevel);

  // Track total conversion duration
  const startTime = performance.now();

  // Capture original input filesize
  const inputSize = fs.statSync(input).size;

  logger.verbose("Loading animation metadata...");

  onProgress?.({
    type: "stage",
    stage: "metadata",
  });

  const metadata = await getAnimationMetadata(input);

  logger.debug("\nFULL METADATA:");
  logger.debug(metadata);

  // Respect source alpha unless explicitly disabled
  const hasAlpha = metadata.hasAlpha && preserveAlpha;

  logger.verbose(`Frames detected: ${metadata.pages}`);

  logger.verbose(`Resolution: ${metadata.width}x${metadata.height}`);

  logger.verbose(`Source alpha detected: ${metadata.hasAlpha}`);

  logger.verbose(`Encoding alpha: ${hasAlpha}`);

  logger.verbose("\nEncoding settings:");

  logger.verbose({
    preset: preset ?? "custom",

    quality,
    speed,
  });

  logger.debug("Launching avifenc process");

  // Streaming encoder child process
  const avifenc = createAvifEncoder({
    output,
    quality,
    speed,
    logLevel,
  });

  // Build timing-aware Y4M stream header
  const header = buildY4MHeader({
    width: metadata.width,
    height: metadata.height,
    hasAlpha,
    delays: metadata.delays,
  });

  logger.debug("\nY4M HEADER:");
  logger.debug(header);

  avifenc.stdin.write(header);

  onProgress?.({
    type: "stage",
    stage: "frames",
  });

  // Expand variable animation timing
  // into a normalized frame timeline
  const { expandedFrames } = expandFrameTimings(metadata.delays);

  // Cache decoded source frames
  // so timing duplication avoids re-extraction
  const frameCache = new Map<number, AnimationFrame>();

  for (let index = 0; index < expandedFrames.length; index++) {
    const frame = expandedFrames[index];

    onProgress?.({
      type: "frame",
      current: index + 1,
      total: expandedFrames.length,
    });

    logger.debug(`Processing frame ${index + 1}/${expandedFrames.length}`);

    let frameData = frameCache.get(frame);

    // Extract each source frame once
    if (!frameData) {
      frameData = await extractFrame({
        input,
        frame,
        hasAlpha,
      });

      frameCache.set(frame, frameData);
    }

    // Duplicate writes preserve timing
    writeFrame(avifenc.stdin, frameData);
  }

  avifenc.stdin.end();

  onProgress?.({
    type: "stage",
    stage: "encoding",
  });

  // Wait for encoder process completion
  //
  // Encoding subprocesses can occasionally:
  // - hang
  // - deadlock
  // - stall on IO
  //
  // Protect against indefinite waits.
  await new Promise<void>((resolve, reject) => {
    // Runtime-safe timer typing
    let timeoutHandle: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      clearTimeout(timeoutHandle);
    };

    // Defensive encoder timeout
    timeoutHandle = setTimeout(() => {
      avifenc.kill();

      reject(new Error("avifenc conversion timeout after 30000ms"));
    }, 30000);

    avifenc.on("close", (code, signal) => {
      cleanup();

      // Successful encoder completion
      if (code === 0) {
        resolve();

        return;
      }

      // Process terminated by signal
      if (signal) {
        reject(new Error(`avifenc killed by signal ${signal}`));

        return;
      }

      // Non-zero encoder exit
      reject(new Error(`avifenc exited with code ${code ?? "unknown"}`));
    });

    // Spawn/runtime process errors
    avifenc.on("error", (error) => {
      cleanup();

      reject(error);
    });
  });

  // Capture final output filesize
  const outputSize = fs.statSync(output).size;

  const reductionPercent = (1 - outputSize / inputSize) * 100;

  const durationMs = performance.now() - startTime;

  // Structured conversion result contract
  return {
    inputSize,
    outputSize,

    reductionPercent,

    sourceFrameCount: metadata.pages,

    durationMs,
  };
}
