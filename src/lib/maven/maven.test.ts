import { MavenCommand } from "./maven";
import { MavenProject } from "./project";
import assert from "assert";
import sinon from "sinon";
import type { ResolvedConfig } from "../config/config";

// Mock dependencies
// We'll use sinon for spies and stubs

describe("MavenCommand", () => {
  let mockProject: any;
  let config: ResolvedConfig;
  let consoleLogStub: sinon.SinonStub;
  let consoleErrorStub: sinon.SinonStub;

  beforeEach(() => {
    mockProject = {
      getModule: sinon.stub(),
      findModuleByPath: sinon.stub(),
      getAll: sinon.stub(),
      root: { absolutePath: "/root", profiles: ["default"] },
    };
    sinon.restore();
    sinon.stub(MavenProject, "load").resolves(mockProject);
    config = {
      maven: {
        mavenInstallCommand: "clean install",
        mavenArguments: "",
        skipTests: false,
        dryRun: false,
        defaultGoal: "install",
        outputMode: "terminal",
      },
      sdk: {
        home: "/root",
        instances: [
          { name: "author", port: 4502, debugPort: 5005, debug: false },
          { name: "publish", port: 4503, debugPort: 5006, debug: false },
        ],
        requiredJavaVersion: 11,
        passwordFile: "aem-password",
        jvmOpts: "-Djava.awt.headless=true",
        jvmDebugBaseOpts:
          "-Djava.awt.headless=true -agentlib:jdwp=transport=dt_socket,server=y,suspend=n",
        quickstartPath: "",
        formsAddonPath: "",
      },
      scaffold: {
        scaffoldArgs: "",
        archetypePluginVersion: "3.3.1",
      },
    };
    consoleLogStub = sinon.stub(console, "log");
    consoleErrorStub = sinon.stub(console, "error");
  });

  afterEach(() => {
    sinon.restore();
  });

  it("runs maven in dry run mode with explicit module", async () => {
    mockProject.getModule.returns({
      absolutePath: "/mod",
      profiles: ["profile1"],
    });
    const mavenCmd = new MavenCommand(config);
    const result = await mavenCmd.create("--dry-run /mod");
    assert(result && result.command.includes("[DRY RUN]"));
  });

  it("runs maven in dry run mode with cwd module resolution", async () => {
    mockProject.getModule.returns(undefined);
    mockProject.findModuleByPath.returns({
      absolutePath: "/root/mod",
      profiles: ["profile2"],
    });
    const mavenCmd = new MavenCommand(config);
    const result = await mavenCmd.create("--dry-run");
    assert(result && result.command.includes("[DRY RUN]"));
  });

  it("prints error if no project found", async () => {
    (MavenProject.load as sinon.SinonStub).resolves(null);
    const mavenCmd = new MavenCommand(config);
    const result = await mavenCmd.create("--dry-run");
    assert.strictEqual(result, undefined);
  });

  it("prints error if no target module found", async () => {
    mockProject.getModule.returns(undefined);
    mockProject.findModuleByPath.returns(undefined);
    const mavenCmd = new MavenCommand(config);
    const result = await mavenCmd.create("--dry-run /notfound");
    assert.strictEqual(result, undefined);
  });

  it("runs maven with Windows-style paths", async () => {
    const winCwd = "C:\\repo\\project";
    const winModule = "C:\\repo\\project\\ui.apps";
    mockProject.getModule.returns({
      absolutePath: winModule,
      profiles: ["profile1"],
    });
    const mavenCmd = new MavenCommand({
      ...config,
      sdk: {
        ...config.sdk,
        home: winCwd,
      },
    });
    const result = await mavenCmd.create(`--dry-run ${winModule}`);
    assert(result && result.command.includes("[DRY RUN]"));
    assert(result && result.command.includes("mvn"));
    assert.ok(result && result.command.match(/C:\\repo\\project\\ui\.apps/));
  });

  it("runs maven with Windows-style paths and resolves module by cwd", async () => {
    const winCwd = "C:\\repo\\project\\ui.apps";
    mockProject.getModule.returns(undefined);
    mockProject.findModuleByPath.returns({
      absolutePath: "C:\\repo\\project\\ui.apps",
      profiles: ["profile2"],
    });
    const mavenCmd = new MavenCommand({
      ...config,
      sdk: {
        ...config.sdk,
        home: winCwd,
      },
    });
    const result = await mavenCmd.create("--dry-run");
    assert(result && result.command.includes("[DRY RUN]"));
    assert.ok(result && result.command.match(/C:\\repo\\project\\ui\.apps/));
  });

  it("runs maven with custom mavenInstallCommand and mavenArguments from config", async () => {
    mockProject.getModule.returns({
      absolutePath: "/mod",
      profiles: ["profile1"],
    });
    const mavenCmd = new MavenCommand({
      ...config,
      maven: {
        ...config.maven,
        mavenInstallCommand: "verify",
        mavenArguments: "--debug",
      },
    });
    const result = await mavenCmd.create("--dry-run /mod");
    assert(result && result.command.includes("mvn --debug verify"));
  });

  it("adds -DskipTests when skipTests is true in opts", async () => {
    mockProject.getModule.returns({
      absolutePath: "/mod",
      profiles: ["profile1"],
    });
    const mavenCmd = new MavenCommand(config);
    const result = await mavenCmd.create("--dry-run --skip-tests /mod");
    assert.ok(result && result.command.includes("-DskipTests"));
  });

  it("adds -DskipTests when skipTests is true in config", async () => {
    mockProject.getModule.returns({
      absolutePath: "/mod",
      profiles: ["profile1"],
    });
    const mavenCmd = new MavenCommand({
      ...config,
      maven: {
        ...config.maven,
        skipTests: true,
      },
    });
    const result = await mavenCmd.create("--dry-run /mod");
    assert.ok(result && result.command.includes("-DskipTests"));
  });

  it("profile flag is set from module profiles if present", async () => {
    mockProject.getModule.returns({
      absolutePath: "/mod",
      profiles: ["autoInstallPackage"],
    });
    const mavenCmd = new MavenCommand(config);
    const result = await mavenCmd.create("--dry-run /mod");
    assert.ok(result && result.command.includes("-PautoInstallPackage"));
  });

  it("does not set profile flag if no profile present", async () => {
    mockProject.getModule.returns({ absolutePath: "/mod", profiles: [] });
    const mavenCmd = new MavenCommand(config);
    const result = await mavenCmd.create("--dry-run /mod");
    assert.ok(result && !result.command.includes("-P"));
  });

  it("command includes correct directory for deeply nested cwd", async () => {
    const deepCwd = "/repo/project/ui.apps/deep/nested";
    mockProject.getModule.returns(undefined);
    mockProject.findModuleByPath.returns({
      absolutePath: "/repo/project/ui.apps",
      profiles: ["profile2"],
    });
    const mavenCmd = new MavenCommand({
      ...config,
      sdk: {
        ...config.sdk,
        home: deepCwd,
      },
    });
    const result = await mavenCmd.create("--dry-run");
    assert.ok(result && result.command.match(/ui\.apps/));
  });
});
