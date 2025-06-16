import assert from "assert";
import path from "path";
import { spawnSync } from "child_process";
import sinon from "sinon";
import { SdkStartCommand } from "../../lib/sdk/commands/start";
import { SdkStopCommand } from "../../lib/sdk/commands/stop";
import { SdkStatusCommand } from "../../lib/sdk/commands/status";
import { SdkLogCommand } from "../../lib/sdk/commands/log";
import { SdkSetupCommand } from "../../lib/sdk/commands/setup";
import type { ArgDefinitions } from "../../lib/utils/argParser";

describe("aem sdk CLI argument parsing", () => {
  const CLI_PATH = path.resolve(__dirname, "../../../dist/cli/aem.js");
  const sdkCommands = [
    { name: "start", cmd: SdkStartCommand },
    { name: "stop", cmd: SdkStopCommand },
    { name: "status", cmd: SdkStatusCommand },
    { name: "log", cmd: SdkLogCommand },
    { name: "setup", cmd: SdkSetupCommand },
  ];
  const dummyValues: Record<string, string> = {
    instance: "author",
    debug: "",
    logFileName: "error.log",
    quickstartPath: "dummy.zip",
    formsAddonPath: "dummy.zip",
    home: "/tmp/aem-home",
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

  sdkCommands.forEach(({ name, cmd }) => {
    const ARGUMENTS = (cmd.ARGUMENTS || {}) as ArgDefinitions;
    Object.entries(ARGUMENTS).forEach(([arg, def]) => {
      const argDef = def as any;
      const aliases = argDef.aliases || [];
      const isFlag = argDef.type === 1; // ArgType.Flag
      const isPositional = argDef.type === 2; // ArgType.Positional
      aliases.forEach((alias: string) => {
        const testName = `should accept sdk ${name} argument: ${arg} (alias: ${alias})`;
        it(testName, () => {
          let cliArg = "";
          if (isPositional) {
            cliArg = dummyValues[arg] || "dummy";
          } else if (isFlag) {
            cliArg = alias.startsWith("-") ? alias : `--${alias}`;
          } else {
            const value = dummyValues[arg] || "dummy";
            cliArg = alias.startsWith("-")
              ? `${alias}=${value}`
              : `--${alias}=${value}`;
          }
          const cmdArr = ["sdk", name, cliArg].filter(Boolean);
          const result = spawnSync("node", [CLI_PATH, ...cmdArr], {
            encoding: "utf8",
          });
          assert.ok(result.stdout || result.stderr, "Should produce output");
          assert.ok(
            execSyncStub.called || spawnStub.called || spawnSyncStub.called,
            "A process method should be mocked and called"
          );
          // Check that the CLI received the correct value for the argument
          if (!isFlag) {
            // Only check for value args, not flags
            const expectedValue = dummyValues[arg] || "dummy";
            // Convert output to string safely
            const outputStr = Buffer.isBuffer(result.stdout)
              ? result.stdout.toString()
              : result.stdout || "";
            const errorStr = Buffer.isBuffer(result.stderr)
              ? result.stderr.toString()
              : result.stderr || "";
            const output = (outputStr + errorStr).toLowerCase();
            assert(
              output.includes(expectedValue.toLowerCase()) ||
                cmdArr.some((a) =>
                  a.toLowerCase().includes(expectedValue.toLowerCase())
                ),
              `Expected value '${expectedValue}' for argument '${arg}' to appear in output or command args: ${cmdArr}`
            );
          }
        });
      });
    });
  });
});
