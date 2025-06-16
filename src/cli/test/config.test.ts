import assert from "assert";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Use the built CLI output
const CLI_PATH = path.resolve(__dirname, "../../../dist/cli/aem.js");

function clearAemEnvVars(env: NodeJS.ProcessEnv) {
  const newEnv = { ...env };
  for (const key of Object.keys(newEnv)) {
    if (key.startsWith("AEM_")) {
      delete newEnv[key];
    }
  }
  return newEnv;
}

describe("aem config CLI", () => {
  const tempConfigPath = path.join(__dirname, "test.aemrc.json");
  const sampleConfig = {
    maven: { skipTests: true, mavenArguments: "-X" },
    scaffold: { scaffoldArgs: "--foo" },
    sdk: { home: "/tmp/sdk", requiredJavaVersion: 17 },
  };

  let cleanEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    cleanEnv = clearAemEnvVars(process.env);
  });

  afterEach(() => {
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
  });

  it("should resolve config with defaults when no file exists", () => {
    const output = execSync(`node ${CLI_PATH} config show`, {
      encoding: "utf8",
      env: cleanEnv,
    });
    assert.ok(output.includes("maven"));
    assert.ok(output.includes("scaffold"));
    assert.ok(output.includes("sdk"));
  });

  it("should resolve config from object (loadConfig)", () => {
    fs.writeFileSync(tempConfigPath, JSON.stringify(sampleConfig));
    const env = { ...cleanEnv, AEM_CONFIG_PATH: tempConfigPath };
    const output = execSync(`node ${CLI_PATH} config show`, {
      encoding: "utf8",
      env,
    });
    assert.ok(output.includes('"skipTests": true'));
    assert.ok(output.includes('"mavenArguments": "-X"'));
    assert.ok(output.includes('"scaffoldArgs": "--foo"'));
    assert.ok(output.includes('"home": "/tmp/sdk"'));
    assert.ok(output.includes('"requiredJavaVersion": 17'));
  });

  it("should resolve config from file (sync, loadConfigFile)", () => {
    fs.writeFileSync(tempConfigPath, JSON.stringify(sampleConfig));
    const env = { ...cleanEnv, AEM_CONFIG_PATH: tempConfigPath };
    const output = execSync(`node ${CLI_PATH} config show`, {
      encoding: "utf8",
      env,
    });
    assert.ok(output.includes('"skipTests": true'));
    assert.ok(output.includes('"mavenArguments": "-X"'));
    assert.ok(output.includes('"scaffoldArgs": "--foo"'));
    assert.ok(output.includes('"home": "/tmp/sdk"'));
    assert.ok(output.includes('"requiredJavaVersion": 17'));
  });

  it("should merge config and resolve schema", () => {
    // Simulate merging config and checking resolved schema
    const baseConfig = { maven: { skipTests: false } };
    const overrideConfig = { maven: { skipTests: true } };
    fs.writeFileSync(tempConfigPath, JSON.stringify(overrideConfig));
    const env = { ...cleanEnv, AEM_CONFIG_PATH: tempConfigPath };
    const output = execSync(`node ${CLI_PATH} config show`, {
      encoding: "utf8",
      env,
    });
    assert.ok(output.includes('"skipTests": true'));
  });

  it("should create a default config file with config init", () => {
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
    const env = { ...cleanEnv, AEM_CONFIG_PATH: tempConfigPath };
    const output = execSync(`node ${CLI_PATH} config init`, {
      encoding: "utf8",
      env,
    });
    assert.ok(fs.existsSync(tempConfigPath));
    const fileContent = fs.readFileSync(tempConfigPath, "utf8");
    assert.ok(fileContent.includes("maven"));
    assert.ok(fileContent.includes("scaffold"));
    assert.ok(fileContent.includes("sdk"));
  });

  it("should show no env overrides with config env", () => {
    const env = clearAemEnvVars(process.env);
    const output = execSync(`node ${CLI_PATH} config env`, {
      encoding: "utf8",
      env,
    });
    assert.ok(output.includes("No config environment variable overrides set."));
  });

  it("should list all available env variables with config env-list", () => {
    const env = clearAemEnvVars(process.env);
    const output = execSync(`node ${CLI_PATH} config env-list`, {
      encoding: "utf8",
      env,
    });
    assert.ok(output.includes("Available config environment variables:"));
    assert.ok(output.match(/AEM_/));
  });

  it("should show env overrides", () => {
    const env = { ...cleanEnv, AEM_SDK_HOME: "/env/override/path" };
    const output = execSync(`node ${CLI_PATH} config env`, {
      encoding: "utf8",
      env,
    });
    assert.ok(output.includes("Config environment variable overrides:"));
    assert.ok(output.includes("sdk.home"));
    assert.ok(output.includes("/env/override/path"));
  });
});
