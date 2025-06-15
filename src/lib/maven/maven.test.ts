import { runMaven } from "./maven";
import { MavenProject } from "./project/project";
import assert from "assert";
import sinon from "sinon";
import type { ResolvedConfig } from "../config/config";

// Mock dependencies
// We'll use sinon for spies and stubs

describe("runMaven", () => {
  let mockProject: any;
  let config: ResolvedConfig;
  let consoleLogStub: sinon.SinonStub;
  let consoleErrorStub: sinon.SinonStub;

  beforeEach(() => {
    mockProject = {
      get: sinon.stub(),
      getAll: sinon.stub(),
      root: { absolutePath: "/root", profiles: ["default"] },
    };
    sinon.restore();
    sinon.stub(MavenProject, "findProject").resolves(mockProject);
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
        sdkHome: "/root",
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
    mockProject.get.returns({
      absolutePath: "/mod",
      profiles: ["profile1"],
    });
    await runMaven(config, { module: "/mod", dryRun: true });
    assert(consoleLogStub.calledWithMatch("[DRY RUN]"));
  });

  it("runs maven in dry run mode with cwd module resolution", async () => {
    mockProject.get.returns(undefined);
    mockProject.getAll.returns([
      { absolutePath: "/root", profiles: ["profile1"] },
      { absolutePath: "/root/mod", profiles: ["profile2"] },
    ]);
    await runMaven(config, { dryRun: true });
    assert(consoleLogStub.calledWithMatch("[DRY RUN]"));
  });

  it("prints error if no project found", async () => {
    sinon.stub(MavenProject, "findProject").resolves(null);
    await runMaven(config, { dryRun: true });
    assert(consoleErrorStub.calledWithMatch("Could not find a Maven project"));
  });

  it("prints error if no target module found", async () => {
    mockProject.get.returns(undefined);
    mockProject.getAll.returns([]);
    await runMaven(config, { module: "/notfound", dryRun: true });
    assert(
      consoleErrorStub.calledWithMatch(
        "Could not determine target Maven module"
      )
    );
  });

  it("runs maven with Windows-style paths", async () => {
    // Simulate a Windows path for cwd and module
    const winCwd = "C:\\repo\\project";
    const winModule = "C:\\repo\\project\\ui.apps";
    mockProject.get.returns({
      absolutePath: winModule,
      profiles: ["profile1"],
    });
    await runMaven(
      {
        ...config,
        sdk: {
          ...config.sdk,
          sdkHome: winCwd,
        },
      },
      { module: winModule, dryRun: true }
    );
    assert(consoleLogStub.calledWithMatch("[DRY RUN]"));
    assert(consoleLogStub.calledWithMatch("mvn"));
    assert.ok(
      consoleLogStub.getCall(0).args[0].match(/C:\\repo\\project\\ui\.apps/)
    );
  });

  it("runs maven with Windows-style paths and resolves module by cwd", async () => {
    const winCwd = "C:\\repo\\project\\ui.apps";
    mockProject.get.returns(undefined);
    mockProject.getAll.returns([
      { absolutePath: "C:\\repo\\project", profiles: ["profile1"] },
      { absolutePath: "C:\\repo\\project\\ui.apps", profiles: ["profile2"] },
    ]);
    await runMaven(
      {
        ...config,
        sdk: {
          ...config.sdk,
          sdkHome: winCwd,
        },
      },
      { dryRun: true }
    );
    assert(consoleLogStub.calledWithMatch("[DRY RUN]"));
    assert.ok(
      consoleLogStub.getCall(0).args[0].match(/C:\\repo\\project\\ui\.apps/)
    );
  });

  it("runs maven with custom mavenInstallCommand and mavenArguments from config", async () => {
    mockProject.get.returns({
      absolutePath: "/mod",
      profiles: ["profile1"],
    });
    await runMaven(
      {
        ...config,
        maven: {
          ...config.maven,
          mavenInstallCommand: "verify",
          mavenArguments: "--debug",
        },
      },
      { module: "/mod", dryRun: true }
    );
    assert(consoleLogStub.calledWithMatch("mvn --debug verify"));
  });

  it("adds -DskipTests when skipTests is true in opts", async () => {
    mockProject.get.returns({
      absolutePath: "/mod",
      profiles: ["profile1"],
    });
    await runMaven(config, { module: "/mod", dryRun: true, skipTests: true });
    assert.ok(consoleLogStub.getCall(0).args[0].includes("-DskipTests"));
  });

  it("adds -DskipTests when skipTests is true in config", async () => {
    mockProject.get.returns({
      absolutePath: "/mod",
      profiles: ["profile1"],
    });
    await runMaven(
      {
        ...config,
        maven: {
          ...config.maven,
          skipTests: true,
        },
      },
      { module: "/mod", dryRun: true }
    );
    assert.ok(consoleLogStub.getCall(0).args[0].includes("-DskipTests"));
  });

  it("profile flag is set from opts.profile", async () => {
    mockProject.get.returns({
      absolutePath: "/mod",
      profiles: ["profile1"],
    });
    await runMaven(config, {
      module: "/mod",
      dryRun: true,
      profile: "customProfile",
    });
    assert.ok(consoleLogStub.getCall(0).args[0].includes("-PcustomProfile"));
  });

  it("profile flag is set from module profiles if no opts.profile", async () => {
    mockProject.get.returns({
      absolutePath: "/mod",
      profiles: ["autoInstallPackage"],
    });
    await runMaven(config, { module: "/mod", dryRun: true });
    assert.ok(
      consoleLogStub.getCall(0).args[0].includes("-PautoInstallPackage")
    );
  });

  it("does not set profile flag if no profile present", async () => {
    mockProject.get.returns({ absolutePath: "/mod", profiles: [] });
    await runMaven(config, { module: "/mod", dryRun: true });
    assert.ok(!consoleLogStub.getCall(0).args[0].includes("-P"));
  });

  it("command includes correct directory for deeply nested cwd", async () => {
    const deepCwd = "/repo/project/ui.apps/deep/nested";
    mockProject.get.returns(undefined);
    mockProject.getAll.returns([
      { absolutePath: "/repo/project", profiles: ["profile1"] },
      { absolutePath: "/repo/project/ui.apps", profiles: ["profile2"] },
    ]);
    await runMaven(
      {
        ...config,
        sdk: {
          ...config.sdk,
          sdkHome: deepCwd,
        },
      },
      { dryRun: true }
    );
    assert.ok(consoleLogStub.getCall(0).args[0].match(/ui\.apps/));
  });
});
