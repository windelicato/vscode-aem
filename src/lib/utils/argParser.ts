/**
 * USAGE EXAMPLES (see below for API and implementation)
 *
 * // Example 1: Simple flags, value, and positional
 * const EXAMPLE_ARGS_1 = {
 *   dryRun: { type: ArgType.Flag, aliases: ["--dry-run", "-d"], description: "Dry run mode" },
 *   test: { type: ArgType.Value, aliases: ["--test", "-t"], description: "Test name" },
 *   file: { type: ArgType.Positional, description: "File to process" },
 * };
 * // parseArgs("-d --test foo myfile.txt", EXAMPLE_ARGS_1)
 * // => { dryRun: true, test: "foo", file: "myfile.txt", errors: [] }
 *
 * // Example 2: Multiple/Repeatable values and required/defaults
 * const EXAMPLE_ARGS_2 = {
 *   include: { type: ArgType.Value, aliases: ["--include", "-i"], description: "Files to include", multiple: true },
 *   out: { type: ArgType.Value, aliases: ["--out", "-o"], description: "Output file", required: true },
 *   verbose: { type: ArgType.Flag, aliases: ["--verbose", "-v"], description: "Verbose mode", default: false },
 *   input: { type: ArgType.Positional, description: "Input file" },
 *   extra: { type: ArgType.Positional, description: "Extra arg", multiple: true },
 * };
 * // parseArgs("-i foo -i bar --out result.txt main.txt arg1 arg2", EXAMPLE_ARGS_2)
 * // => { include: ["foo", "bar"], out: "result.txt", verbose: false, input: "main.txt", extra: ["arg1", "arg2"], errors: [] }
 *
 * // Example 3: Help generation
 * // console.log(generateHelp(EXAMPLE_ARGS_2));
 * // Output:
 * // --include, -i
 * //     Files to include (repeatable)
 * //
 * // --out, -o (required)
 * //     Output file
 * //
 * // --verbose, -v
 * //     Verbose mode [default: false]
 * //
 * // <input>
 * //     Input file
 * //
 * // <extra>
 * //     Extra arg (repeatable)
 */

// --- CLI Argument Parser API and Implementation ---

/**
 * CLI argument parser with type-safe definitions and best practices.
 * Supports boolean flags, value arguments, positional arguments (named and documented), repeatable flags, defaults, required, and help generation.
 *
 * Usage:
 *   const ARGUMENTS = {
 *     dryRun: { type: ArgType.Flag, aliases: ["--dry-run", "-d"], description: "Dry run mode", default: false },
 *     test: { type: ArgType.Value, aliases: ["--test", "-t"], description: "Test name", required: true },
 *     include: { type: ArgType.Value, aliases: ["--include", "-i"], description: "Include files", multiple: true },
 *   };
 *   const opts = parseArgs("-d --test=foo --include a --include b bar baz", ARGUMENTS);
 *   // opts: { dryRun: true, test: "foo", include: ["a", "b"], others: ["bar", "baz"], errors: [] }
 */

export enum ArgType {
  Flag = "flag",
  Value = "value",
  Positional = "positional",
}

export type ArgDefinition = {
  type: ArgType;
  aliases?: string[]; // not needed for positional
  description?: string;
  multiple?: boolean;
  default?: string | boolean;
  required?: boolean;
};

export type ArgDefinitions = Record<string, ArgDefinition>;

export type ParsedArgs<T extends ArgDefinitions> = {
  [K in keyof T]: T[K]["type"] extends ArgType.Flag
    ? T[K]["multiple"] extends true
      ? boolean[]
      : boolean | null
    : T[K]["type"] extends ArgType.Value
    ? T[K]["multiple"] extends true
      ? string[]
      : string | null
    : T[K]["type"] extends ArgType.Positional
    ? T[K]["multiple"] extends true
      ? string[]
      : string | null
    : never;
} & { errors: string[] };

export function parseArgs<T extends ArgDefinitions>(
  input: string,
  argAliases: T,
  strict: boolean = false
): ParsedArgs<T> {
  // Inject --help if not present
  const hasHelp = Object.values(argAliases).some((arg) =>
    arg.aliases?.includes("--help")
  );
  const argDefs = hasHelp
    ? argAliases
    : {
        ...argAliases,
        help: {
          type: ArgType.Flag,
          aliases: ["--help", "-h"],
          description: "Show help for this command",
          default: false,
        },
      };

  const args = input.trim().split(/\s+/);
  if (args.includes('--help') || args.includes('-h')) {
    // Print help and exit
    // @ts-ignore
    console.log(generateHelp(argDefs));
    process.exit(0);
  }

  const opts = {} as ParsedArgs<typeof argDefs>;
  const positionalKeys = Object.keys(argDefs).filter(
    (k) => argDefs[k].type === ArgType.Positional
  );
  let positionalIndex = 0;

  for (const key in argDefs) {
    if (argDefs[key].multiple) {
      opts[key] = [] as any;
    } else if (typeof argDefs[key].default !== "undefined") {
      opts[key] = argDefs[key].default as any;
    } else {
      opts[key] = null as any;
    }
  }
  opts.errors = [];

  for (let i = 0; i < args.length; i++) {
    let arg = args[i];
    let matched = false;

    // Handle --key=value or key=value
    if (arg.includes("=")) {
      const [argKey, value] = arg.split("=", 2);
      for (const key in argDefs) {
        if (
          argDefs[key].type !== ArgType.Positional &&
          argDefs[key].aliases?.includes(argKey)
        ) {
          if (argDefs[key].type === ArgType.Flag) {
            let boolVal: boolean;
            if (value === "true") {
              boolVal = true;
            } else if (value === "false") {
              boolVal = false;
            } else {
              boolVal = Boolean(value);
            }
            if (argDefs[key].multiple) {
              (opts[key] as boolean[]).push(boolVal);
            } else {
              opts[key] = boolVal as any;
            }
          } else {
            if (argDefs[key].multiple) {
              (opts[key] as string[]).push(value);
            } else {
              opts[key] = value as any;
            }
          }
          matched = true;
          break;
        }
      }
    } else {
      for (const key in argDefs) {
        if (
          argDefs[key].type !== ArgType.Positional &&
          argDefs[key].aliases?.includes(arg)
        ) {
          if (argDefs[key].type === ArgType.Value) {
            if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
              const val = args[i + 1];
              if (argDefs[key].multiple) {
                (opts[key] as string[]).push(val);
              } else {
                opts[key] = val as any;
              }
              i++;
            } else {
              opts[key] = null as any;
              const err = `Missing value for argument: ${arg}`;
              if (strict) {
                throw new Error(err);
              }
              opts.errors.push(err);
            }
          } else {
            let boolVal = true;
            if (
              i + 1 < args.length &&
              (args[i + 1] === "true" || args[i + 1] === "false")
            ) {
              boolVal = args[i + 1] === "true";
              i++;
            }
            if (argDefs[key].multiple) {
              (opts[key] as boolean[]).push(boolVal);
            } else {
              opts[key] = boolVal as any;
            }
          }
          matched = true;
          break;
        }
      }
    }

    if (!matched && !arg.startsWith("-")) {
      // Assign to named positional args in order
      if (positionalIndex < positionalKeys.length) {
        const posKey = positionalKeys[positionalIndex];
        if (argDefs[posKey].multiple) {
          (opts[posKey] as string[]).push(arg);
        } else {
          (opts as any)[posKey] = arg;
        }
        positionalIndex++;
      }
    }
  }

  // Check for required arguments
  for (const key in argDefs) {
    if (argDefs[key].required) {
      const val = opts[key];
      const isMissing = argDefs[key].multiple
        ? !(Array.isArray(val) && val.length > 0)
        : val === null || val === undefined;
      if (isMissing) {
        const err = `Missing required argument: ${key}`;
        if (strict) {
          throw new Error(err);
        }
        opts.errors.push(err);
      }
    }
  }

  return opts;
}

/**
 * Generate CLI help/usage text from argument definitions, including positional args.
 */
export function generateHelp<T extends ArgDefinitions>(argAliases: T): string {
  return Object.entries(argAliases)
    .map(([key, def]) => {
      const aliasStr =
        def.type === ArgType.Positional
          ? `<${key}>`
          : def.aliases?.join(", ") || "";
      return `${aliasStr}${def.required ? " (required)" : ""}\n    ${
        def.description || ""
      }${def.default !== undefined ? ` [default: ${def.default}]` : ""}${
        def.multiple ? " (repeatable)" : ""
      }`;
    })
    .join("\n\n");
}
