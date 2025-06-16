import * as assert from "assert";
import { ScaffoldCommand } from "../../lib/scaffold/scaffold";
import * as path from "path";

declare const suite: Mocha.SuiteFunction;
declare const setup: Mocha.HookFunction;
declare const teardown: Mocha.HookFunction;
declare const test: Mocha.TestFunction;

suite("ScaffoldCommand", () => {
  let config: any;
  let fixtureRoot: string;
  setup(() => {
    fixtureRoot = path.resolve(__dirname, "../../../src/vscode/test/fixtures");
    config = {
      scaffold: {
        scaffoldArgs: '-DgroupId={packageName} -DappTitle="{appTitle}"',
        archetypePluginVersion: "3.3.1",
      },
    };
  });
  test("creates correct maven command from input", async () => {
    const input = '--appTitle "My App" --packageName mysite';
    const scaffoldCmd = new ScaffoldCommand(config as any);
    const { command, cwd } = await scaffoldCmd.create(input);
    assert.ok(
      command.startsWith(
        "mvn -B org.apache.maven.plugins:maven-archetype-plugin:3.3.1:generate"
      ),
      "Command should start with archetype generate"
    );
    assert.ok(
      command.includes("-DgroupId=mysite"),
      "Command should include groupId"
    );
    assert.ok(
      command.includes('-DappTitle="My App"'),
      "Command should include appTitle"
    );
    assert.strictEqual(
      cwd,
      process.cwd(),
      "cwd should be current working directory"
    );
  });
  test("throws error if required arguments are missing", async () => {
    const scaffoldCmd = new ScaffoldCommand(config as any);
    await assert.rejects(
      scaffoldCmd.create('--appTitle "My App"'),
      /Argument parsing errors: Missing required argument: packageName/
    );
    await assert.rejects(
      scaffoldCmd.create("--packageName mysite"),
      /Argument parsing errors: Missing required argument: appTitle/
    );
  });
});
