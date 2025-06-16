#!/usr/bin/env node
import { loadConfigFile } from "../lib/config/config";
import { handleSdkCommand } from "./commands/sdk";
import { handleMavenCommand } from "./commands/maven";
import { handleScaffoldCommand } from "./commands/scaffold";
import { handleConfigCommand } from "./commands/config";
import { printHelp, printSubcommandHelp } from "./help";

const config = loadConfigFile();
const [, , cmd, subcmd, ...args] = process.argv;

async function main() {
  try {
    if (cmd === "help" || cmd === "--help" || cmd === "-h" || !cmd) {
      printHelp();
      process.exit(0);
    }
    if (subcmd === "--help" || subcmd === "-h") {
      printSubcommandHelp(cmd);
      process.exit(0);
    }
    if (args.includes("--help") || args.includes("-h")) {
      printSubcommandHelp(cmd, subcmd);
      process.exit(0);
    }
    if (cmd === "sdk") {
      await handleSdkCommand(subcmd, args, config);
    } else if (cmd === "maven") {
      await handleMavenCommand(subcmd, args, config);
    } else if (cmd === "scaffold") {
      await handleScaffoldCommand(subcmd, args, config);
    } else if (cmd === "config") {
      handleConfigCommand(subcmd, args);
    } else {
      console.error("Unknown command:", cmd);
      printHelp();
      process.exit(1);
    }
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
