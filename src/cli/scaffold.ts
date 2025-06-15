// Handles 'aem scaffold' commands
import { ScaffoldProjectCommand } from "../lib/scaffold/scaffold";

const commands = {
  project: new ScaffoldProjectCommand(),
};

export async function handleScaffoldCommand(args: string[]) {
  const [subcommand, ...rest] = args;

  if (subcommand === "help" || subcommand === "--help" || subcommand === undefined) {
    console.log("aem scaffold <subcommand> [args]\n");
    Object.entries(commands).forEach(([name, cmd]) => {
      console.log(`${name}:`);
      cmd.showHelp();
      console.log();
    });
    return;
  }

  const command = commands[subcommand as keyof typeof commands];
  if (!command) {
    console.error("Unknown scaffold subcommand");
    process.exit(1);
  }

  await command.run(rest.join(" "));
}
