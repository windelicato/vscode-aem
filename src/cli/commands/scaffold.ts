import { ScaffoldCommand } from "../../lib/scaffold/scaffold";

export async function handleScaffoldCommand(
  subcmd: string,
  args: string[],
  config: any
) {
  await new ScaffoldCommand(config).run(
    [subcmd, ...args].filter(Boolean).join(" ")
  );
}
