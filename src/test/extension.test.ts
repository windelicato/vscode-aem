import * as assert from 'assert';
import * as vscode from 'vscode';
import { AemMavenHelper } from '../aemMavenHelper';
import * as path from 'path';

// Fix: Use correct path to fixtures directory for both src and out
const fixtureRoot = path.resolve(__dirname, '../../src/test/fixtures');
process.chdir(fixtureRoot);

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});
});

suite('AemMavenHelper Command Construction', () => {
	test('builds command with --build flag', () => {
		const helper = new AemMavenHelper(fixtureRoot);
		helper.parseInputArgs('ui.apps --build', { skipTests: false, dryRun: false });
		const { command, error } = helper.buildCommand();
		assert.strictEqual(error, undefined);
		assert.ok(command.startsWith('mvn clean install'));
	});

	test('adds -DskipTests when skipTests is true', () => {
		const helper = new AemMavenHelper(fixtureRoot);
		helper.parseInputArgs('ui.apps --build', { skipTests: true, dryRun: false });
		const { command } = helper.buildCommand();
		assert.ok(command.includes('-DskipTests'));
	});

	test('wraps command in echo for dryRun', () => {
		const helper = new AemMavenHelper(fixtureRoot);
		helper.parseInputArgs('ui.apps --build', { skipTests: false, dryRun: true });
		const { command } = helper.buildCommand();
		assert.ok(command.startsWith('echo [DRY RUN]'));
	});

	test('CLI flag --skip-tests overrides config', () => {
		const helper = new AemMavenHelper(fixtureRoot);
		helper.parseInputArgs('ui.apps --build --skip-tests', { skipTests: false, dryRun: false });
		const { command } = helper.buildCommand();
		assert.ok(command.includes('-DskipTests'));
	});

	test('CLI flag --dry-run overrides config', () => {
		const helper = new AemMavenHelper(fixtureRoot);
		helper.parseInputArgs('ui.apps --build --dry-run', { skipTests: false, dryRun: false });
		const { command } = helper.buildCommand();
		assert.ok(command.startsWith('echo [DRY RUN]'));
	});

	test('returns error if no module found', () => {
		const helper = new AemMavenHelper('/nonexistent/path');
		helper.parseInputArgs('nonexistent', { skipTests: false, dryRun: false });
		const { error } = helper.buildCommand();
		assert.ok(error);
	});
});

suite('AemMavenHelper Command Construction (with AEM archetype fixtures)', () => {
	test('builds command for ui.apps with profile', () => {
		const helper = new AemMavenHelper(fixtureRoot);
		helper.parseInputArgs('ui.apps', { skipTests: false, dryRun: false });
		const { command, error, directory } = helper.buildCommand();
		assert.strictEqual(error, undefined);
		assert.ok(command.includes('-PautoInstallPackage'));
		assert.ok(directory.endsWith('ui.apps'));
	});

	test('builds command for all module with profile', () => {
		const helper = new AemMavenHelper(fixtureRoot);
		helper.parseInputArgs('all', { skipTests: false, dryRun: false });
		const { command, error, directory } = helper.buildCommand();
		assert.strictEqual(error, undefined);
		assert.ok(command.includes('-PautoInstallSinglePackage'));
		assert.ok(directory.endsWith('all'));
	});

	test('builds command for core bundle (no profile, falls back to build)', () => {
		const helper = new AemMavenHelper(fixtureRoot);
		helper.parseInputArgs('core --build', { skipTests: false, dryRun: false });
		const { command, error, directory } = helper.buildCommand();
		assert.strictEqual(error, undefined);
		assert.ok(command.startsWith('mvn clean install'));
		assert.ok(directory.endsWith('core'));
	});

	test('resolves root pom to all module if present', () => {
		const helper = new AemMavenHelper(fixtureRoot);
		helper.parseInputArgs('', { skipTests: false, dryRun: false });
		const { command, error, directory } = helper.buildCommand();
		assert.strictEqual(error, undefined);
		assert.ok(directory.endsWith('all'));
		assert.ok(command.includes('-PautoInstallSinglePackage'));
	});

	test('running from deep nested dir builds correct module', () => {
		const deepDir = path.join(fixtureRoot, 'ui.apps/deep/nested');
		const helper = new AemMavenHelper(deepDir);
		helper.parseInputArgs('', { skipTests: false, dryRun: false });
		const { command, error, directory } = helper.buildCommand();
		assert.strictEqual(error, undefined);
		assert.ok(directory.endsWith('ui.apps'));
		assert.ok(command.includes('-PautoInstallPackage'));
	});

	test('running from deep nested dir builds core with autoInstallBundle if present', () => {
		const deepDir = path.join(fixtureRoot, 'ui.apps/deep/nested');
		const helper = new AemMavenHelper(deepDir);
		helper.parseInputArgs('core --skip-tests --dry-run', { skipTests: false, dryRun: false });
		const { command, error, directory } = helper.buildCommand();
		assert.strictEqual(error, undefined);
		assert.ok(directory.endsWith('core'));
		assert.ok(command.includes('-PautoInstallBundle'));
		assert.ok(command.includes('-DskipTests'));
		assert.ok(command.startsWith('echo [DRY RUN]'));
	});
});
