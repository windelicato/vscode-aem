// Main CLI logic for aem helper
import { handleSdkCommand } from "./sdk";
import { handleMavenCommand } from "./maven";
import { handleScaffoldCommand } from "./scaffold";

function printHelp() {
  console.log(`Usage: aem <command> [subcommand] [args...]

Commands:
  sdk <subcommand> [args]        SDK related commands (setup, start, stop, status, log)
  maven <subcommand> [args]      Maven related commands (install, etc.)
  scaffold <subcommand> [args]   Project scaffolding commands
`);
}

export async function main() {
  const [, , command, ...args] = process.argv;
  if (!command) {
    printHelp();
    process.exit(1);
  }
  switch (command) {
    case "sdk":
      await handleSdkCommand(args);
      break;
    case "maven":
      await handleMavenCommand(args);
      break;
    case "scaffold":
      await handleScaffoldCommand(args);
      break;
    case "help":
    default:
      printHelp();
      process.exit(1);
  }
}
