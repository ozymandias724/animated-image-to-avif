# aviphy

Convert animated GIF and WebP images into animated AVIF using Bun and `avifenc`.

`aviphy` is designed primarily as a programmable conversion library for:

- automation scripts
- media pipelines
- Bun tooling
- batch processing
- developer workflows

It supports:

- animated GIF input
- animated WebP input
- animated AVIF output
- alpha transparency
- configurable quality/speed presets
- progress callbacks
- quiet / verbose / debug logging modes
- cross-platform CI validation

---

# Requirements

This package requires `avifenc` to be installed and available on your system PATH.

## macOS

```bash
brew install libavif
```

## Ubuntu / Debian

```bash
sudo apt install libavif-bin
```

## Windows

Download prebuilt binaries from:

https://github.com/AOMediaCodec/libavif/releases

Ensure `avifenc.exe` is available on your PATH.

---

# Installation

```bash
bun add aviphy
```

---

# Quick Start

```ts
import { convert } from "aviphy";

await convert({
  input: "./input.gif",
  output: "./output.avif",
});
```

---

# Basic Example

```ts
import { convert } from "aviphy";

const result = await convert({
  input: "./input.webp",
  output: "./output.avif",

  preset: "balanced",

  quality: 60,
  speed: 6,

  logLevel: "verbose",
});

console.log(result);
```

---

# Logging Modes

## quiet (default)

Minimal/no console output.

Recommended for:

- APIs
- automation
- embedded usage
- scripting pipelines

---

## verbose

Human-friendly operational logging.

Includes:

- metadata loading
- encoder startup
- conversion timing
- compression results

---

## debug

Maximum diagnostic visibility.

Includes:

- frame processing logs
- raw encoder diagnostics
- subprocess debugging information
- encoder lifecycle details

---

# API

## convert(options)

```ts
await convert({
  input: "./input.gif",
  output: "./output.avif",
});
```

---

# ConvertOptions

```ts
type ConvertOptions = {
  input: string;
  output: string;

  preset?: PresetName;

  quality?: number;
  speed?: number;

  preserveAlpha?: boolean;

  logLevel?: "quiet" | "verbose" | "debug";

  onProgress?: (
    event: ConversionProgressEvent,
  ) => void;
};
```

---

# Presets

```ts
preset: "fast"
preset: "balanced"
preset: "quality"
```

Presets provide sensible quality/speed defaults while still allowing explicit overrides.

---

# Result Object

```ts
{
  inputSize: number;
  outputSize: number;
  reductionPercent: number;

  sourceFrameCount: number;

  durationMs: number;
}
```

---

# Progress Events

`aviphy` supports progress callbacks for custom:

- progress bars
- spinners
- telemetry
- logging systems
- UI updates

Example:

```ts
await convert({
  input: "./input.gif",
  output: "./output.avif",

  onProgress(event) {
    console.log(event);
  },
});
```

---

# CLI Utility

A lightweight CLI utility is included primarily for:

- local testing
- debugging
- development workflows

Example:

```bash
bun run src/cli.ts fixtures/test.gif tmp/output.avif --debug
```

---

# Development

Run tests:

```bash
bun test
```

Run tests with coverage:

```bash
bun test --coverage
```

---

# License

MIT

