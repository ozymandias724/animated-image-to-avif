import { spawn } from "node:child_process";

import type { LogLevel } from "./log";

type AvifEncoderOptions = {
  output: string;
  quality: number;
  speed: number;

  logLevel: LogLevel;
};

export function createAvifEncoder({
  output,
  quality,
  speed,
  logLevel,
}: AvifEncoderOptions) {
  // Spawn avifenc as a streaming child process
  const encoder = spawn("avifenc", [
    "--stdin",

    // BT.709 / sRGB signaling
    "--cicp",
    "1/13/0",

    "-q",
    String(quality),

    "--speed",
    String(speed),

    output,
  ]);

  // IMPORTANT:
  //
  // Subprocess stdout/stderr MUST be consumed
  // or internal buffers can eventually block
  // the encoder process.
  //
  // quiet / verbose:
  //   consume silently
  //
  // debug:
  //   surface raw encoder diagnostics

  if (logLevel === "debug") {
    // Surface encoder stderr directly
    encoder.stderr.on("data", (data) => {
      process.stderr.write(data);
    });

    // Surface encoder stdout directly
    encoder.stdout.on("data", (data) => {
      process.stdout.write(data);
    });
  } else {
    // Silently drain encoder streams
    // to avoid subprocess deadlocks
    encoder.stderr.on("data", () => {});

    encoder.stdout.on("data", () => {});
  }

  // Helpful during debugging / failure tracing
  encoder.on("close", (code) => {
    if (logLevel === "debug") {
      console.log(`\navifenc exited with code ${code}`);
    }
  });

  // Child process launch/runtime failures
  encoder.on("error", (error) => {
    console.error("\navifenc process error:");

    console.error(error);
  });

  return encoder;
}
