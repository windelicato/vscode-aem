// Handles 'aem maven' commands
import { MavenInstallCommand } from "../lib/maven/maven";

const commands = {
  install: new MavenInstallCommand(),
};

export async function handleMavenCommand(args: string[]) {
  const [subcommand, ...rest] = args;

  if (subcommand === "help" || subcommand === "--help" || subcommand === undefined) {
    console.log("aem maven <subcommand> [args]\n");
    Object.entries(commands).forEach(([name, cmd]) => {
      console.log(`${name}:`);
      cmd.showHelp();
      console.log();
    });
    return;
  }

  const command = commands[subcommand as keyof typeof commands];
  if (!command) {
    console.error("Unknown maven subcommand");
    process.exit(1);
  }

  await command.run(rest.join(" "));
}
