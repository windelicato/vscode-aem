//import * as assert from 'assert';
//import * as path from 'path';
//import * as vscode from 'vscode';
//import { AemSDKHelper } from '../aem/sdk/helper';
//import { Uri } from 'vscode';
//import * as fs from 'fs';
//import * as sinon from 'sinon';
//import mockFs from 'mock-fs';
//
//suite('AemSDKHelper Command Registration', () => {
//  test('AemSDKHelper exposes all SDK commands', () => {
//    assert.ok(typeof AemSDKHelper.setup === 'function', 'setup should be a function');
//    assert.ok(typeof AemSDKHelper.start === 'function', 'start should be a function');
//    assert.ok(typeof AemSDKHelper.status === 'function', 'status should be a function');
//    assert.ok(typeof AemSDKHelper.log === 'function', 'log should be a function');
//    assert.ok(typeof AemSDKHelper.stop === 'function', 'stop should be a function');
//  });
//});
//
//suite('AEM SDK Setup Command', function() {
//  this.timeout(10000); // Increase timeout to 10 seconds for async/mocked FS
//  let originalShowInputBox: any;
//  let originalShowOpenDialog: any;
//  let originalShowQuickPick: any;
//  let unzipperMock: any;
//  let unzipper: any;
//  setup(function() { // was beforeEach
//    mockFs({
//      '/mock/path/to': {
//        'aem-sdk-quickstart.zip': 'fakezipcontent',
//        'aem-forms-addon.far': 'fakefarcontent'
//      },
//      '/mock/sdk/home': {}
//    });
//    originalShowInputBox = vscode.window.showInputBox;
//    originalShowOpenDialog = vscode.window.showOpenDialog;
//    originalShowQuickPick = vscode.window.showQuickPick;
//    vscode.window.showInputBox = async (opts?: any) => '/mock/path/to/aem-sdk-quickstart.zip';
//    vscode.window.showOpenDialog = async (opts?: any) => [Uri.file('/mock/path/to/aem-sdk-quickstart.zip')];
//    vscode.window.showQuickPick = async (items: any) => items[0]; // Always pick the first option (Yes)
//    // Mock unzipper
//    unzipper = require('unzipper');
//    unzipperMock = sinon.stub(unzipper.Open, 'file').callsFake(async (...args: unknown[]) => {
//      const zipPath = args[0] as string;
//      return {
//        files: [
//          { path: 'aem-sdk-quickstart-1.0.0.jar', stream: () => fs.createReadStream('/mock/path/to/aem-sdk-quickstart.zip') }
//        ]
//      };
//    });
//    // Mock config
//    sinon.stub(vscode.workspace, 'getConfiguration').returns({
//      get: (key: string, def: any) => {
//        if (key === 'home') { return '/mock/sdk/home'; }
//        if (key === 'quickstartPath') { return '/mock/path/to/aem-sdk-quickstart.zip'; }
//        if (key === 'formsAddonPath') { return '/mock/path/to/aem-forms-addon.far'; }
//        if (key === 'instances') { return [{ name: 'author', port: 4502, debugPort: 5005 }]; }
//        return def;
//      },
//      update: async () => {}
//    } as any);
//  });
//  teardown(function() { // was afterEach
//    vscode.window.showInputBox = originalShowInputBox;
//    vscode.window.showOpenDialog = originalShowOpenDialog;
//    vscode.window.showQuickPick = originalShowQuickPick;
//    unzipperMock.restore && unzipperMock.restore();
//    mockFs.restore();
//    sinon.restore();
//  });
//  test('setup handles missing config gracefully', async () => {
//    await assert.doesNotReject(() => AemSDKHelper.setup(), 'setup should not throw');
//  });
//  test('setup prompts for quickstart and forms addon if config is present', async () => {
//    // This will use the mocked input box and open dialog
//    await assert.doesNotReject(() => AemSDKHelper.setup(), 'setup should not throw with mocked input');
//  });
//  test('setup is async and can be called with no args', async () => {
//    assert.ok(AemSDKHelper.setup.constructor.name === 'AsyncFunction');
//  });
//});
//
//// Integration-style test for start command in a real temp directory
//const os = require('os');
//suite('AEM SDK Start Integration', function() {
//  this.timeout(10000);
//  test('start creates instance directory on first run and does not recreate on second run', async () => {
//    const tempDir = require('fs').mkdtempSync(path.join(os.tmpdir(), 'aem-sdk-test-'));
//    const instanceDir = path.join(tempDir, 'author');
//    const configStub = sinon.stub(vscode.workspace, 'getConfiguration').returns({
//      get: (key: string, def: any) => {
//        if (key === 'home') { return tempDir; }
//        if (key === 'instances') { return [{ name: 'author', port: 4502, debugPort: 5005 }]; }
//        return def;
//      },
//      update: async () => {}
//    } as any);
//    const fakeChild = { pid: 12345, unref: () => {} };
//    const spawnStub = sinon.stub(require('child_process'), 'spawn').returns(fakeChild as any);
//    assert.ok(!require('fs').existsSync(instanceDir), 'Instance directory should not exist before first run');
//    await assert.doesNotReject(() => AemSDKHelper.start(), 'start should not throw on first run');
//    const passwordFile = path.join(instanceDir, 'aem-password');
//    assert.ok(require('fs').existsSync(passwordFile), 'Password file should be created on first run');
//    const firstCall = spawnStub.getCall(0);
//    assert.ok(firstCall, 'spawn should be called on first run');
//    assert.ok(
//      typeof firstCall.args[0] === 'string' && firstCall.args[0].includes('java') && firstCall.args[0].includes('-jar'),
//      'First run should call java -jar'
//    );
//    const binDir = path.join(instanceDir, 'crx-quickstart/bin');
//    const startScript = path.join(binDir, 'start');
//    require('fs').mkdirSync(binDir, { recursive: true });
//    require('fs').writeFileSync(startScript, '#!/bin/sh\necho start', { mode: 0o755 });
//    await assert.doesNotReject(() => AemSDKHelper.start(), 'start should not throw on second run');
//    const secondCall = spawnStub.getCall(1);
//    assert.ok(secondCall, 'spawn should be called on second run');
//    assert.strictEqual(secondCall.args[0], './start', 'Second run should call ./start');
//    assert.ok(secondCall.args[2] && secondCall.args[2].cwd && secondCall.args[2].cwd.endsWith('/crx-quickstart/bin'), 'Second run should use bin dir as cwd');
//    spawnStub.restore();
//    configStub.restore && configStub.restore();
//    require('fs').rmSync(tempDir, { recursive: true, force: true });
//  });
//});
//
//// Unit tests for AEM SDK Start Command (mock-fs)
//suite('AEM SDK Start Command', () => {
//  let originalShowInputBox: any;
//  let originalShowOpenDialog: any;
//  let originalShowQuickPick: any;
//  let configStub: any;
//  let spawnStub: any;
//  let instanceDir = '/mock/sdk/home/author';
//  setup(function() {
//    mockFs({
//      '/mock/sdk/home': {}
//    });
//    originalShowInputBox = vscode.window.showInputBox;
//    originalShowOpenDialog = vscode.window.showOpenDialog;
//    originalShowQuickPick = vscode.window.showQuickPick;
//    vscode.window.showInputBox = async () => undefined;
//    vscode.window.showOpenDialog = async () => undefined;
//    vscode.window.showQuickPick = async (items: any) => items[0];
//    configStub = sinon.stub(vscode.workspace, 'getConfiguration').returns({
//      get: (key: string, def: any) => {
//        if (key === 'home') { return '/mock/sdk/home'; }
//        if (key === 'instances') { return [{ name: 'author', port: 4502, debugPort: 5005 }]; }
//        return def;
//      },
//      update: async () => {}
//    } as any);
//    const fakeChild = { pid: 12345, unref: () => {} };
//    spawnStub = sinon.stub(require('child_process'), 'spawn').returns(fakeChild as any);
//  });
//  teardown(function() {
//    vscode.window.showInputBox = originalShowInputBox;
//    vscode.window.showOpenDialog = originalShowOpenDialog;
//    vscode.window.showQuickPick = originalShowQuickPick;
//    configStub.restore && configStub.restore();
//    spawnStub && spawnStub.restore();
//    mockFs.restore();
//    sinon.restore();
//  });
//  test('start handles missing config gracefully', async () => {
//    await assert.doesNotReject(() => AemSDKHelper.start(), 'start should not throw');
//  });
//  test('start is async and can be called with no args', async () => {
//    assert.ok(AemSDKHelper.start.constructor.name === 'AsyncFunction');
//  });
//});
//
//suite('AEM SDK Status Command', () => {
//  test('status handles missing config gracefully', async () => {
//    await assert.doesNotReject(() => AemSDKHelper.status(), 'status should not throw');
//  });
//  test('status is async and can be called with no args', async () => {
//    assert.ok(AemSDKHelper.status.constructor.name === 'AsyncFunction');
//  });
//});
//
//suite('AEM SDK Log Command', function() {
//  let originalShowInputBox: any;
//  setup(function() { // use global setup, not this.setup
//    originalShowInputBox = vscode.window.showInputBox;
//    vscode.window.showInputBox = async (opts?: any) => 'error.log';
//  });
//  teardown(function() { // use global teardown, not this.teardown
//    vscode.window.showInputBox = originalShowInputBox;
//  });
//  test('log handles missing config gracefully', async () => {
//    await assert.doesNotReject(() => AemSDKHelper.log(), 'log should not throw');
//  });
//  test('log is async and can be called with no args', async () => {
//    assert.ok(AemSDKHelper.log.constructor.name === 'AsyncFunction');
//  });
//});
//
//suite('AEM SDK Stop Command', () => {
//  test('stop handles missing config gracefully', async () => {
//    await assert.doesNotReject(() => AemSDKHelper.stop(), 'stop should not throw');
//  });
//  test('stop is async and can be called with no args', async () => {
//    assert.ok(AemSDKHelper.stop.constructor.name === 'AsyncFunction');
//  });
//});
//
