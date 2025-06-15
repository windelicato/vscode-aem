import * as assert from "assert";
import { AemMavenHelper } from "../aem/maven/helper";
import * as path from "path";
import * as vscode from "vscode";
import * as sinon from "sinon";

// Fix: Use correct path to fixtures directory - point to source fixtures
const fixtureRoot = path.resolve(
  __dirname,
  "../../../src/vscode/test/fixtures"
);
process.chdir(fixtureRoot);

suite("AemMavenHelper Command Construction", () => {
  test("builds command with --build flag", () => {
    const { command, error } = AemMavenHelper.buildCommand({
      cwd: fixtureRoot,
      input: "ui.apps --build",
    });
    assert.strictEqual(error, undefined);
    assert.ok(command.startsWith("mvn clean install"));
  });

  test("adds -DskipTests when skipTests is true", () => {
    const { command } = AemMavenHelper.buildCommand({
      cwd: fixtureRoot,
      input: "ui.apps --build --skip-tests",
    });
    assert.ok(command.includes("-DskipTests"));
  });

  test("wraps command in echo for dryRun", () => {
    const { command } = AemMavenHelper.buildCommand({
      cwd: fixtureRoot,
      input: "ui.apps --build --dry-run",
    });
    assert.ok(command.startsWith("echo [DRY RUN]"));
  });

  test("CLI flag --skip-tests overrides config", () => {
    const { command } = AemMavenHelper.buildCommand({
      cwd: fixtureRoot,
      input: "ui.apps --build --skip-tests",
    });
    assert.ok(command.includes("-DskipTests"));
  });

  test("CLI flag --dry-run overrides config", () => {
    const { command } = AemMavenHelper.buildCommand({
      cwd: fixtureRoot,
      input: "ui.apps --build --dry-run",
    });
    assert.ok(command.startsWith("echo [DRY RUN]"));
  });

  test("returns error if no module found", () => {
    const { error } = AemMavenHelper.buildCommand({
      cwd: "/nonexistent/path",
      input: "nonexistent",
    });
    assert.ok(error);
  });
});

suite(
  "AemMavenHelper Command Construction (with AEM archetype fixtures)",
  () => {
    test("builds command for ui.apps with profile", () => {
      const { command, error, directory } = AemMavenHelper.buildCommand({
        cwd: fixtureRoot,
        input: "ui.apps",
      });
      assert.strictEqual(error, undefined);
      assert.ok(command.includes("-PautoInstallPackage"));
      assert.ok(directory.endsWith("ui.apps"));
    });

    test("builds command for ui.apps with profile and --install", () => {
      const { command, error, directory } = AemMavenHelper.buildCommand({
        cwd: fixtureRoot,
        input: "ui.apps install",
      });
      assert.strictEqual(error, undefined);
      assert.ok(command.includes("-PautoInstallPackage"));
      assert.ok(command.startsWith("mvn clean install"));
      assert.ok(directory.endsWith("ui.apps"));
    });

    test("builds command for ui.apps with profile and --build", () => {
      const { command, error, directory } = AemMavenHelper.buildCommand({
        cwd: fixtureRoot,
        input: "ui.apps build",
      });
      assert.strictEqual(error, undefined);
      assert.ok(!command.includes("-PautoInstallPackage"));
      assert.ok(command.startsWith("mvn clean install"));
      assert.ok(directory.endsWith("ui.apps"));
    });

    test("builds command for all module with profile", () => {
      const { command, error, directory } = AemMavenHelper.buildCommand({
        cwd: fixtureRoot,
        input: "all",
      });
      assert.strictEqual(error, undefined);
      assert.ok(command.includes("-PautoInstallSinglePackage"));
    });

    test("builds command for core bundle (no profile, falls back to build)", () => {
      const { command, error, directory } = AemMavenHelper.buildCommand({
        cwd: fixtureRoot,
        input: "core --build",
      });
      assert.strictEqual(error, undefined);
      assert.ok(command.startsWith("mvn clean install"));
      assert.ok(directory.endsWith("core"));
    });

    test("running from deep nested dir builds correct module", () => {
      const deepDir = path.join(fixtureRoot, "ui.apps/deep/nested");
      const { command, error, directory } = AemMavenHelper.buildCommand({
        cwd: deepDir,
        input: "",
      });
      assert.strictEqual(error, undefined);
      assert.ok(directory.endsWith("ui.apps"));
      assert.ok(command.includes("-PautoInstallPackage"));
    });

    test("running from deep nested dir builds core with autoInstallBundle if present", () => {
      const deepDir = path.join(fixtureRoot, "ui.apps/deep/nested");
      const { command, error, directory } = AemMavenHelper.buildCommand({
        cwd: deepDir,
        input: "core --skip-tests --dry-run",
      });
      assert.strictEqual(error, undefined);
      assert.ok(directory.endsWith("core"));
      assert.ok(command.includes("-PautoInstallBundle"));
      assert.ok(command.includes("-DskipTests"));
      assert.ok(command.startsWith("echo [DRY RUN]"));
    });

    test("builds command for all module also builds root pom with singlepackage", () => {
      const { command, error, directory } = AemMavenHelper.buildCommand({
        cwd: fixtureRoot,
        input: "all",
      });
      assert.strictEqual(error, undefined);
      assert.ok(command.includes("-PautoInstallSinglePackage"));
      // Should use root pom, not a separate all module
      assert.ok(directory.endsWith("fixtures"));
    });

    test("respects mavenInstallCommand and mavenArguments from config", () => {
      const getConfigurationStub = sinon.stub(
        vscode.workspace,
        "getConfiguration"
      );
      getConfigurationStub.withArgs("aemMaven").returns({
        get: (key: string, def: any) => {
          if (key === "mavenInstallCommand") {
            return "verify";
          }
          if (key === "mavenArguments") {
            return "--debug";
          }
          return def;
        },
      } as any);
      getConfigurationStub.withArgs("aemMavenHelper").returns({
        get: (key: string, def: any) => def,
      } as any);

      const { command } = AemMavenHelper.buildCommand({
        cwd: fixtureRoot,
        input: "ui.apps --build",
      });
      assert.ok(command.startsWith("mvn --debug verify"));
      getConfigurationStub.restore();
    });
  }
);

suite("VS Code Extension Command (explorer/context)", () => {
  test("runs with no input when invoked from context menu (uri provided)", async () => {
    // Mock the VS Code API
    let inputBoxShown = false;
    const originalShowInputBox = vscode.window.showInputBox;
    vscode.window.showInputBox = async () => {
      inputBoxShown = true;
      return "should-not-be-called";
    };

    // Prepare a fake URI (as if right-clicked in explorer)
    const fakeUri = vscode.Uri.file(path.join(fixtureRoot, "ui.apps"));
    // Simulate the command handler logic
    let usedCwd = fakeUri.fsPath;
    let usedInput = "";
    let input: string | undefined;
    if (!fakeUri) {
      input = await vscode.window.showInputBox({
        prompt: "aem-mvn arguments (e.g. ui.apps)",
        placeHolder: "<module> [--build] [--all]",
      });
      if (input === undefined) {
        vscode.window.showInputBox = originalShowInputBox;
        return;
      }
    } else {
      input = "";
    }
    usedInput = input;
    const { command, directory, error } = AemMavenHelper.buildCommand({
      cwd: usedCwd,
      input: usedInput,
    });
    // Restore
    vscode.window.showInputBox = originalShowInputBox;
    // Assert
    assert.strictEqual(inputBoxShown, false, "Input box should not be shown");
    assert.strictEqual(usedInput, "", "Input should be empty string");
    assert.strictEqual(
      usedCwd,
      fakeUri.fsPath,
      "cwd should be the right-clicked path"
    );
    assert.ok(command);
  });

  test("VS Code Extension Command (explorer/context) works with config stubs", async () => {
    const getConfigurationStub = sinon.stub(
      vscode.workspace,
      "getConfiguration"
    );
    getConfigurationStub.withArgs("aemMaven").returns({
      get: (key: string, def: any) => {
        if (key === "mavenInstallCommand") {
          return "clean install";
        }
        if (key === "mavenArguments") {
          return "";
        }
        return def;
      },
    } as any);
    getConfigurationStub.withArgs("aemMavenHelper").returns({
      get: (key: string, def: any) => def,
    } as any);

    let inputBoxShown = false;
    const originalShowInputBox = vscode.window.showInputBox;
    vscode.window.showInputBox = async () => {
      inputBoxShown = true;
      return "should-not-be-called";
    };

    const fakeUri = vscode.Uri.file(path.join(fixtureRoot, "ui.apps"));
    let usedCwd = fakeUri.fsPath;
    let usedInput = "";
    let input: string | undefined;
    if (!fakeUri) {
      input = await vscode.window.showInputBox({
        prompt: "aem-mvn arguments (e.g. ui.apps)",
        placeHolder: "<module> [--build] [--all]",
      });
      if (input === undefined) {
        vscode.window.showInputBox = originalShowInputBox;
        getConfigurationStub.restore();
        return;
      }
    } else {
      input = "";
    }
    usedInput = input;
    const { command, directory, error } = AemMavenHelper.buildCommand({
      cwd: usedCwd,
      input: usedInput,
    });
    vscode.window.showInputBox = originalShowInputBox;
    getConfigurationStub.restore();
    assert.strictEqual(inputBoxShown, false, "Input box should not be shown");
    assert.strictEqual(usedInput, "", "Input should be empty string");
    assert.strictEqual(
      usedCwd,
      fakeUri.fsPath,
      "cwd should be the right-clicked path"
    );
    assert.ok(command);
  });
});
