import { describe, expect, test } from "bun:test";

import { resolveConfig } from "../src/config";

describe("resolveConfig", () => {
  describe("default resolution", () => {
    test("resolves valid configuration with defaults", () => {
      // Minimal valid config
      // should receive fallback defaults
      const config = resolveConfig({
        input: "fixtures/test.gif",

        output: "tmp/test.avif",
      });

      expect(config).toEqual({
        input: "fixtures/test.gif",

        output: "tmp/test.avif",

        preset: undefined,

        quality: 50,
        speed: 8,

        preserveAlpha: true,

        logLevel: "quiet",
      });
    });

    test("applies preset values", () => {
      // Presets provide
      // encoder defaults
      const config = resolveConfig({
        input: "fixtures/test.gif",

        output: "tmp/test.avif",

        preset: "balanced",
      });

      expect(config).toEqual({
        input: "fixtures/test.gif",

        output: "tmp/test.avif",

        preset: "balanced",

        quality: 50,
        speed: 8,

        preserveAlpha: true,

        logLevel: "quiet",
      });
    });

    test("explicit options override preset values", () => {
      // Explicit values should
      // always override presets
      const config = resolveConfig({
        input: "fixtures/test.gif",

        output: "tmp/test.avif",

        preset: "balanced",

        quality: 80,
        speed: 5,
      });

      expect(config).toEqual({
        input: "fixtures/test.gif",

        output: "tmp/test.avif",

        preset: "balanced",

        quality: 80,
        speed: 5,

        preserveAlpha: true,

        logLevel: "quiet",
      });
    });
  });

  describe("path validation", () => {
    test("throws for missing input path", () => {
      // Empty input paths
      // are invalid
      expect(() =>
        resolveConfig({
          input: "   ",

          output: "tmp/test.avif",
        }),
      ).toThrow("Input path is required.");
    });

    test("throws for missing output path", () => {
      // Empty output paths
      // are invalid
      expect(() =>
        resolveConfig({
          input: "fixtures/test.gif",

          output: "   ",
        }),
      ).toThrow("Output path is required.");
    });

    test("throws when input file does not exist", () => {
      // Input file must exist
      // before conversion begins
      expect(() =>
        resolveConfig({
          input: "fixtures/nonexistent.gif",

          output: "tmp/test.avif",
        }),
      ).toThrow("Input file does not exist: fixtures/nonexistent.gif");
    });

    test("throws when output directory does not exist", () => {
      // Output directory must exist
      expect(() =>
        resolveConfig({
          input: "fixtures/test.gif",

          output: "nonexistent_dir/test.avif",
        }),
      ).toThrow("Output directory does not exist: nonexistent_dir");
    });

    test("throws when input and output paths are identical", () => {
      // Prevent accidental
      // overwrite-on-self
      expect(() =>
        resolveConfig({
          input: "fixtures/test.gif",

          output: "fixtures/test.gif",
        }),
      ).toThrow("Input and output paths cannot be the same.");
    });
  });

  describe("option validation", () => {
    test("throws for unknown preset", () => {
      // Unknown presets
      // should fail validation
      expect(() =>
        resolveConfig({
          input: "fixtures/test.gif",

          output: "tmp/test.avif",

          preset: "unknown" as any,
        }),
      ).toThrow("Unknown preset: unknown");
    });

    test("throws for quality out of range", () => {
      // Quality is clamped
      // between 0 and 100
      expect(() =>
        resolveConfig({
          input: "fixtures/test.gif",

          output: "tmp/test.avif",

          quality: 150,
        }),
      ).toThrow("Quality must be between 0 and 100.");
    });

    test("throws for speed out of range", () => {
      // Speed is clamped
      // between 0 and 10
      expect(() =>
        resolveConfig({
          input: "fixtures/test.gif",

          output: "tmp/test.avif",

          speed: -1,
        }),
      ).toThrow("Speed must be between 0 and 10.");
    });
  });
});
