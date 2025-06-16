import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { MavenCommand } from "../../lib/maven/maven";

suite("MavenCommand", () => {
  let fixtureRoot: string;
  let originalCwd: string;
  let defaultConfig: any;
  setup(() => {
    fixtureRoot = path.resolve(__dirname, "../../../src/vscode/test/fixtures");
    originalCwd = process.cwd();
    defaultConfig = {
      maven: {
        skipTests: false,
        dryRun: false,
        defaultGoal: "install",
        outputMode: "terminal",
        mavenArguments: "",
        mavenInstallCommand: "clean install",
      },
    };
    process.chdir(fixtureRoot);
  });
  teardown(() => {
    process.chdir(originalCwd);
  });
  test("builds command with --build flag", async () => {
    const mavenCmd = new MavenCommand(defaultConfig as any);
    const { command } = await mavenCmd.create("ui.apps --build");
    assert.ok(command.startsWith("mvn clean install"));
  });
  test("adds -DskipTests when skipTests is true", async () => {
    const mavenCmd = new MavenCommand(defaultConfig as any);
    const { command } = await mavenCmd.create("ui.apps --build --skip-tests");
    assert.ok(command.includes("-DskipTests"));
  });
  test("wraps command in echo for dryRun", async () => {
    const mavenCmd = new MavenCommand(defaultConfig as any);
    const { command } = await mavenCmd.create("ui.apps --build --dry-run");
    assert.ok(command.startsWith("echo [DRY RUN]"));
  });
  test("returns error if no module found", async () => {
    const mavenCmd = new MavenCommand(defaultConfig as any);
    await assert.rejects(
      mavenCmd.create("nonexistent"),
      /Could not determine target Maven module/
    );
  });
  test("builds command for ui.apps with profile", async () => {
    const mavenCmd = new MavenCommand(defaultConfig as any);
    const { command, cwd } = await mavenCmd.create("ui.apps");
    assert.ok(command.includes("-PautoInstallPackage"));
    assert.ok(cwd.endsWith("ui.apps"));
  });
  test("builds command for ui.apps with profile and --install", async () => {
    const mavenCmd = new MavenCommand(defaultConfig as any);
    const { command, cwd } = await mavenCmd.create("ui.apps install");
    assert.ok(command.includes("-PautoInstallPackage"));
    assert.ok(command.startsWith("mvn clean install"));
    assert.ok(cwd.endsWith("ui.apps"));
  });
  test("builds command for ui.apps with profile and --build", async () => {
    const mavenCmd = new MavenCommand(defaultConfig as any);
    const { command, cwd } = await mavenCmd.create("ui.apps build");
    assert.ok(!command.includes("-PautoInstallPackage"));
    assert.ok(command.startsWith("mvn clean install"));
    assert.ok(cwd.endsWith("ui.apps"));
  });
  test("builds command for all module with profile", async () => {
    const mavenCmd = new MavenCommand(defaultConfig as any);
    const { command } = await mavenCmd.create("all");
    assert.ok(command.includes("-PautoInstallSinglePackage"));
  });
  test("builds command for core bundle (no profile, falls back to build)", async () => {
    const mavenCmd = new MavenCommand(defaultConfig as any);
    const { command, cwd } = await mavenCmd.create("core --build");
    assert.ok(command.startsWith("mvn clean install"));
    assert.ok(cwd.endsWith("core"));
  });
  test("running from deep nested dir builds correct module", async () => {
    const deepDir = path.join(fixtureRoot, "ui.apps/deep/nested");
    process.chdir(deepDir);
    const mavenCmd = new MavenCommand(defaultConfig as any);
    const { command, cwd } = await mavenCmd.create("");
    assert.ok(cwd.endsWith("ui.apps"));
    assert.ok(command.includes("-PautoInstallPackage"));
    process.chdir(fixtureRoot);
  });
  test("running from deep nested dir builds core with autoInstallBundle if present", async () => {
    const deepDir = path.join(fixtureRoot, "ui.apps/deep/nested");
    process.chdir(deepDir);
    const mavenCmd = new MavenCommand(defaultConfig as any);
    const { command, cwd } = await mavenCmd.create(
      "core --skip-tests --dry-run"
    );
    assert.ok(cwd.endsWith("core"));
    assert.ok(command.includes("-PautoInstallBundle"));
    assert.ok(command.includes("-DskipTests"));
    assert.ok(command.startsWith("echo [DRY RUN]"));
    process.chdir(fixtureRoot);
  });
  test("builds command for all module also builds root pom with singlepackage", async () => {
    const mavenCmd = new MavenCommand(defaultConfig as any);
    const { command, cwd } = await mavenCmd.create("all");
    assert.ok(command.includes("-PautoInstallSinglePackage"));
    assert.ok(cwd.endsWith("fixtures"));
  });
  test("respects mavenInstallCommand and mavenArguments from config", async () => {
    const customConfig = {
      maven: {
        ...defaultConfig.maven,
        mavenInstallCommand: "verify",
        mavenArguments: "--debug",
      },
    };
    const mavenCmd = new MavenCommand(customConfig as any);
    const { command } = await mavenCmd.create("ui.apps --build");
    assert.ok(command.startsWith("mvn --debug verify"));
  });
  test("throws error if not in a Maven project", async () => {
    const mavenCmd = new MavenCommand(defaultConfig as any);
    process.chdir("/");
    await assert.rejects(
      mavenCmd.create("ui.apps"),
      /Could not find a Maven project/
    );
    process.chdir(fixtureRoot);
  });
});
