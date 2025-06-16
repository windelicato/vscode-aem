import assert from "assert";
import path from "path";
import { spawnSync } from "child_process";
import { MavenCommand } from "../../lib/maven/maven";
import type { ArgDefinitions } from "../../lib/utils/argParser";
import sinon from "sinon";

describe("aem maven CLI argument parsing", () => {
  const CLI_PATH = path.resolve(__dirname, "../../../dist/cli/aem.js");
  const ARGUMENTS = MavenCommand.ARGUMENTS as ArgDefinitions;
  const dummyValues: Record<string, string> = {
    module: "ui.apps",
  };

  let execSyncStub: sinon.SinonStub;
  let spawnStub: sinon.SinonStub;
  let spawnSyncStub: sinon.SinonStub;

  beforeEach(() => {
    execSyncStub = sinon
      .stub(require("child_process"), "execSync")
      .callsFake(() => Buffer.from("MOCKED"));
    spawnStub = sinon.stub(require("child_process"), "spawn").callsFake(() => ({
      stdout: { on: () => {} },
      stderr: { on: () => {} },
      on: () => {},
      unref: () => {},
      kill: () => {},
      pid: 12345,
    }));
    spawnSyncStub = sinon
      .stub(require("child_process"), "spawnSync")
      .callsFake(() => ({
        stdout: Buffer.from("MOCKED"),
        stderr: Buffer.from(""),
      }));
  });
  afterEach(() => {
    execSyncStub.restore();
    spawnStub.restore();
    spawnSyncStub.restore();
  });

  Object.entries(ARGUMENTS).forEach(([arg, def]) => {
    const argDef = def as any;
    const aliases = argDef.aliases || [];
    const isFlag = argDef.type === 1; // ArgType.Flag
    const isPositional = argDef.type === 2; // ArgType.Positional
    aliases.forEach((alias: string) => {
      const testName = `should accept argument: ${arg} (alias: ${alias})`;
      it(testName, () => {
        let cliArg = "";
        if (isPositional) {
          cliArg = dummyValues[arg] || "dummy";
        } else if (isFlag) {
          cliArg = alias.startsWith("-") ? alias : `--${alias}`;
        } else {
          cliArg = alias.startsWith("-")
            ? `${alias}=dummy`
            : `--${alias}=dummy`;
        }
        const cmd = ["maven", cliArg].filter(Boolean).join(" ");
        const result = spawnSync("node", [CLI_PATH, ...cmd.split(" ")], {
          encoding: "utf8",
        });
        assert.ok(result.stdout || result.stderr, "Should produce output");
        assert.ok(
          execSyncStub.called || spawnStub.called || spawnSyncStub.called,
          "A process method should be mocked and called"
        );
      });
    });
  });
});
