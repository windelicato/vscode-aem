import { MavenCommand } from "../../lib/maven/maven";

export async function handleMavenCommand(
  subcmd: string,
  args: string[],
  config: any
) {
  await new MavenCommand(config).run(
    [subcmd, ...args].filter(Boolean).join(" ")
  );
}
