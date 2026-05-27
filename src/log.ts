// Logging verbosity contract
//
// quiet:
//   Minimal/no runtime output
//
// verbose:
//   Human-friendly operational logging
//
// debug:
//   Maximum diagnostic detail
// Logging verbosity contract
export type LogLevel = "quiet" | "verbose" | "debug";

type Logger = {
  verbose: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
};

// Create runtime logger helpers
export function createLogger(logLevel: LogLevel): Logger {
  return {
    // Human-friendly operational logs
    verbose: (...args: unknown[]) => {
      if (logLevel === "verbose" || logLevel === "debug") {
        console.log(...args);
      }
    },

    // Maximum diagnostic logging
    debug: (...args: unknown[]) => {
      if (logLevel === "debug") {
        console.log(...args);
      }
    },
  };
}
