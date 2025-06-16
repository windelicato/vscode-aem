import * as assert from "assert";
import * as path from "path";
import * as sinon from "sinon";
import mockFs from "mock-fs";
import * as fs from "fs";
import { SdkSetupCommand } from "../../lib/sdk/commands/setup";
import { SdkStartCommand } from "../../lib/sdk/commands/start";
import { SdkStatusCommand } from "../../lib/sdk/commands/status";
import { SdkLogCommand } from "../../lib/sdk/commands/log";
import { SdkStopCommand } from "../../lib/sdk/commands/stop";

suite("SDK Command Registration", () => {
  test("SDK command classes are constructible", () => {
    assert.ok(typeof SdkSetupCommand === "function");
    assert.ok(typeof SdkStartCommand === "function");
    assert.ok(typeof SdkStatusCommand === "function");
    assert.ok(typeof SdkLogCommand === "function");
    assert.ok(typeof SdkStopCommand === "function");
  });
});

suite("SDK Setup Command", function () {
  this.timeout(10000);
  let defaultConfig: any;
  setup(function () {
    mockFs({
      "/mock/path/to": {
        "aem-sdk-quickstart.zip": "fakezipcontent",
        "aem-forms-addon.far": "fakefarcontent",
      },
      "/mock/sdk/home": {},
    });
    defaultConfig = {
      sdk: {
        home: "/mock/sdk/home",
        instances: [
          { name: "author", port: 4502, debugPort: 5005, debug: false },
        ],
        requiredJavaVersion: 11,
        passwordFile: "aem-password",
        jvmOpts: "-Djava.awt.headless=true",
        jvmDebugBaseOpts:
          "-Djava.awt.headless=true -agentlib:jdwp=transport=dt_socket,server=y,suspend=n",
        quickstartPath: "/mock/path/to/aem-sdk-quickstart.zip",
        formsAddonPath: "/mock/path/to/aem-forms-addon.far",
      },
    };
  });
  teardown(function () {
    mockFs.restore();
    sinon.restore();
  });
  test("create returns info", async () => {
    const cmd = new SdkSetupCommand(defaultConfig as any);
    const result = await cmd.create("");
    assert.ok(result.command === "sdk-setup");
  });
});

const os = require("os");
suite("SDK Start Integration", function () {
  this.timeout(10000);
  test("start creates instance directory on first run and does not recreate on second run", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "aem-sdk-test-"));
    const instanceDir = path.join(tempDir, "author");
    const config = {
      sdk: {
        home: tempDir,
        instances: [
          { name: "author", port: 4502, debugPort: 5005, debug: false },
        ],
        requiredJavaVersion: 11,
        passwordFile: "aem-password",
        jvmOpts: "-Djava.awt.headless=true",
        jvmDebugBaseOpts:
          "-Djava.awt.headless=true -agentlib:jdwp=transport=dt_socket,server=y,suspend=n",
        quickstartPath: "/mock/path/to/aem-sdk-quickstart.zip",
        formsAddonPath: "/mock/path/to/aem-forms-addon.far",
      },
    };
    // Updated fakeChild to include .on method
    const fakeChild = { pid: 12345, unref: () => {}, on: () => {} };
    const spawnStub = sinon
      .stub(require("child_process"), "spawn")
      .returns(fakeChild as any);
    assert.ok(
      !fs.existsSync(instanceDir),
      "Instance directory should not exist before first run"
    );
    const cmd = new SdkStartCommand(config as any);
    await assert.doesNotReject(
      () => cmd.run(""),
      "start should not throw on first run"
    );
    const passwordFile = path.join(instanceDir, "aem-password");
    assert.ok(
      fs.existsSync(passwordFile),
      "Password file should be created on first run"
    );
    const firstCall = spawnStub.getCall(0);
    assert.ok(firstCall, "spawn should be called on first run");
    const binDir = path.join(instanceDir, "crx-quickstart/bin");
    const startScript = path.join(binDir, "start");
    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(startScript, "#!/bin/sh\necho start", { mode: 0o755 });
    await assert.doesNotReject(
      () => cmd.run(""),
      "start should not throw on second run"
    );
    const secondCall = spawnStub.getCall(1);
    assert.ok(secondCall, "spawn should be called on second run");
    spawnStub.restore();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});

suite("SDK Status Command", () => {
  test("status create returns info", async () => {
    const config = {
      sdk: {
        home: "/mock/sdk/home",
        instances: [
          { name: "author", port: 4502, debugPort: 5005, debug: false },
        ],
        requiredJavaVersion: 11,
        passwordFile: "aem-password",
        jvmOpts: "-Djava.awt.headless=true",
        jvmDebugBaseOpts:
          "-Djava.awt.headless=true -agentlib:jdwp=transport=dt_socket,server=y,suspend=n",
        quickstartPath: "/mock/path/to/aem-sdk-quickstart.zip",
        formsAddonPath: "/mock/path/to/aem-forms-addon.far",
      },
    };
    const cmd = new SdkStatusCommand(config as any);
    const result = await cmd.create("");
    assert.ok(result.command === "start");
  });
});

suite("SDK Log Command", function () {
  test("log create returns info", async () => {
    const config = {
      sdk: {
        home: "/mock/sdk/home",
        instances: [
          { name: "author", port: 4502, debugPort: 5005, debug: false },
        ],
        requiredJavaVersion: 11,
        passwordFile: "aem-password",
        jvmOpts: "-Djava.awt.headless=true",
        jvmDebugBaseOpts:
          "-Djava.awt.headless=true -agentlib:jdwp=transport=dt_socket,server=y,suspend=n",
        quickstartPath: "/mock/path/to/aem-sdk-quickstart.zip",
        formsAddonPath: "/mock/path/to/aem-forms-addon.far",
      },
    };
    const cmd = new SdkLogCommand(config as any);
    const result = await cmd.create("");
    assert.ok(result.command === "sdk-log");
  });
});

suite("SDK Stop Command", () => {
  test("stop create returns info", async () => {
    const config = {
      sdk: {
        home: "/mock/sdk/home",
        instances: [
          { name: "author", port: 4502, debugPort: 5005, debug: false },
        ],
        requiredJavaVersion: 11,
        passwordFile: "aem-password",
        jvmOpts: "-Djava.awt.headless=true",
        jvmDebugBaseOpts:
          "-Djava.awt.headless=true -agentlib:jdwp=transport=dt_socket,server=y,suspend=n",
        quickstartPath: "/mock/path/to/aem-sdk-quickstart.zip",
        formsAddonPath: "/mock/path/to/aem-forms-addon.far",
      },
    };
    const cmd = new SdkStopCommand(config as any);
    const result = await cmd.create("");
    assert.ok(result.command === "start");
  });
});
