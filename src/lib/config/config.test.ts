import {
  configSchema,
  loadConfigAsync,
  loadConfigSync,
  mergeConfig,
  resolveSchema,
} from "./config";
import fs from "fs";
import path from "path";
import assert from "assert";

suite("config system", () => {
  const tempConfigPath = path.join(__dirname, "test.aemrc.json");
  const sampleConfig = {
    maven: { skipTests: true, mavenArguments: "-X" },
    scaffold: { scaffoldArgs: "--foo" },
    sdk: { sdkHome: "/tmp/sdk", requiredJavaVersion: 17 },
  };

  suiteSetup(() => {
    // Remove all AEM_ env vars to ensure test isolation for all tests
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith("AEM_")) {
        delete process.env[key];
      }
    });
  });

  teardown(() => {
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
  });

  test("should resolve config with defaults when no file exists", () => {
    const config = loadConfigSync("nonexistent.aemrc.json");
    assert.ok(config.maven.hasOwnProperty("skipTests"));
    assert.ok(config.scaffold.hasOwnProperty("scaffoldArgs"));
    assert.ok(config.sdk.hasOwnProperty("sdkHome"));
  });

  test("should resolve config from file (sync)", () => {
    fs.writeFileSync(tempConfigPath, JSON.stringify(sampleConfig));
    const config = loadConfigSync(tempConfigPath);
    assert.strictEqual(config.maven.skipTests, true);
    assert.strictEqual(config.maven.mavenArguments, "-X");
    assert.strictEqual(config.scaffold.scaffoldArgs, "--foo");
    assert.strictEqual(config.sdk.sdkHome, "/tmp/sdk");
    assert.strictEqual(config.sdk.requiredJavaVersion, 17);
  });

  test("should resolve config from file (async)", async () => {
    fs.writeFileSync(tempConfigPath, JSON.stringify(sampleConfig));
    const config = await loadConfigAsync(tempConfigPath);
    assert.strictEqual(config.maven.skipTests, true);
    assert.strictEqual(config.maven.mavenArguments, "-X");
    assert.strictEqual(config.scaffold.scaffoldArgs, "--foo");
    assert.strictEqual(config.sdk.sdkHome, "/tmp/sdk");
    assert.strictEqual(config.sdk.requiredJavaVersion, 17);
  });

  test("should merge configs", () => {
    const base = {
      maven: { skipTests: false, mavenArguments: "" },
      sdk: { sdkHome: "/b", requiredJavaVersion: 11 },
    };
    const override = {
      maven: { skipTests: true, mavenArguments: "-X" },
      sdk: { sdkHome: "/a", requiredJavaVersion: 17 },
    };
    const merged = mergeConfig(base, override);
    assert.strictEqual(merged.maven.skipTests, true);
    assert.strictEqual(merged.maven.mavenArguments, "-X");
    assert.strictEqual(merged.sdk.sdkHome, "/a");
    assert.strictEqual(merged.sdk.requiredJavaVersion, 17);
  });

  test("configSchema should have expected properties", () => {
    assert.ok(configSchema.hasOwnProperty("maven"));
    assert.ok(configSchema.hasOwnProperty("scaffold"));
    assert.ok(configSchema.hasOwnProperty("sdk"));
  });

  test("should resolve schema", () => {
    const resolved = resolveSchema(configSchema);
    assert.strictEqual(resolved.maven.skipTests, false);
    assert.ok(resolved.scaffold.hasOwnProperty("scaffoldArgs"));
    assert.ok(resolved.sdk.hasOwnProperty("sdkHome"));
  });

  test("should loadConfigSync with windows paths", () => {
    const winConfig = {
      maven: { skipTests: true, mavenArguments: "-X" },
      scaffold: { scaffoldArgs: "--foo" },
      sdk: { sdkHome: "C:/tmp/sdk", requiredJavaVersion: 17 },
    };
    fs.writeFileSync(tempConfigPath, JSON.stringify(winConfig));
    const config = loadConfigSync(tempConfigPath);
    assert.strictEqual(config.maven.skipTests, true);
    assert.strictEqual(config.maven.mavenArguments, "-X");
    assert.strictEqual(config.scaffold.scaffoldArgs, "--foo");
    assert.strictEqual(config.sdk.sdkHome, "C:/tmp/sdk");
    assert.strictEqual(config.sdk.requiredJavaVersion, 17);
  });

  test("should loadConfigAsync with windows paths", async () => {
    const winConfig = {
      maven: { skipTests: true, mavenArguments: "-X" },
      scaffold: { scaffoldArgs: "--foo" },
      sdk: { sdkHome: "C:/tmp/sdk", requiredJavaVersion: 17 },
    };
    fs.writeFileSync(tempConfigPath, JSON.stringify(winConfig));
    const config = await loadConfigAsync(tempConfigPath);
    assert.strictEqual(config.maven.skipTests, true);
    assert.strictEqual(config.maven.mavenArguments, "-X");
    assert.strictEqual(config.scaffold.scaffoldArgs, "--foo");
    assert.strictEqual(config.sdk.sdkHome, "C:/tmp/sdk");
    assert.strictEqual(config.sdk.requiredJavaVersion, 17);
  });
});

describe("windows path compatibility", () => {
  const winConfigPath = "C:\\tmp\\test.aemrc.json";
  const winSampleConfig = {
    maven: { skipTests: true, mavenArguments: "-X" },
    scaffold: { scaffoldArgs: "--foo" },
    sdk: { sdkHome: "C:/tmp/sdk", requiredJavaVersion: 17 },
  };

  afterEach(() => {
    if (fs.existsSync(winConfigPath)) {
      fs.unlinkSync(winConfigPath);
    }
  });

  it("should resolve config from file (sync) with windows path", () => {
    fs.writeFileSync(winConfigPath, JSON.stringify(winSampleConfig));
    const config = loadConfigSync(winConfigPath);
    assert.strictEqual(config.maven.skipTests, true);
    assert.strictEqual(config.maven.mavenArguments, "-X");
    assert.strictEqual(config.scaffold.scaffoldArgs, "--foo");
    assert.strictEqual(config.sdk.sdkHome, "C:/tmp/sdk");
    assert.strictEqual(config.sdk.requiredJavaVersion, 17);
  });

  it("should resolve config from file (async) with windows path", async () => {
    fs.writeFileSync(winConfigPath, JSON.stringify(winSampleConfig));
    const config = await loadConfigAsync(winConfigPath);
    assert.strictEqual(config.maven.skipTests, true);
    assert.strictEqual(config.maven.mavenArguments, "-X");
    assert.strictEqual(config.scaffold.scaffoldArgs, "--foo");
    assert.strictEqual(config.sdk.sdkHome, "C:/tmp/sdk");
    assert.strictEqual(config.sdk.requiredJavaVersion, 17);
  });
});
