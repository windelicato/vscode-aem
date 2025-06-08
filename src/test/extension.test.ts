import * as assert from 'assert';
import * as vscode from 'vscode';
import { AemMavenHelper } from '../aem/maven/helper';
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
		const { command, error } = AemMavenHelper.buildCommand({
			cwd: fixtureRoot,
			input: 'ui.apps --build',
			opts: { skipTests: false, dryRun: false }
		});
		assert.strictEqual(error, undefined);
		assert.ok(command.startsWith('mvn clean install'));
	});

	test('adds -DskipTests when skipTests is true', () => {
		const { command } = AemMavenHelper.buildCommand({
			cwd: fixtureRoot,
			input: 'ui.apps --build',
			opts: { skipTests: true, dryRun: false }
		});
		assert.ok(command.includes('-DskipTests'));
	});

	test('wraps command in echo for dryRun', () => {
		const { command } = AemMavenHelper.buildCommand({
			cwd: fixtureRoot,
			input: 'ui.apps --build',
			opts: { skipTests: false, dryRun: true }
		});
		assert.ok(command.startsWith('echo [DRY RUN]'));
	});

	test('CLI flag --skip-tests overrides config', () => {
		const { command } = AemMavenHelper.buildCommand({
			cwd: fixtureRoot,
			input: 'ui.apps --build --skip-tests',
			opts: { skipTests: false, dryRun: false }
		});
		assert.ok(command.includes('-DskipTests'));
	});

	test('CLI flag --dry-run overrides config', () => {
		const { command } = AemMavenHelper.buildCommand({
			cwd: fixtureRoot,
			input: 'ui.apps --build --dry-run',
			opts: { skipTests: false, dryRun: false }
		});
		assert.ok(command.startsWith('echo [DRY RUN]'));
	});

	test('returns error if no module found', () => {
		const { error } = AemMavenHelper.buildCommand({
			cwd: '/nonexistent/path',
			input: 'nonexistent',
			opts: { skipTests: false, dryRun: false }
		});
		assert.ok(error);
	});
});

suite('AemMavenHelper Command Construction (with AEM archetype fixtures)', () => {
	test('builds command for ui.apps with profile', () => {
		const { command, error, directory } = AemMavenHelper.buildCommand({
			cwd: fixtureRoot,
			input: 'ui.apps',
			opts: { skipTests: false, dryRun: false }
		});
		assert.strictEqual(error, undefined);
		assert.ok(command.includes('-PautoInstallPackage'));
		assert.ok(directory.endsWith('ui.apps'));
	});

	test('builds command for all module with profile', () => {
		const { command, error, directory } = AemMavenHelper.buildCommand({
			cwd: fixtureRoot,
			input: 'all',
			opts: { skipTests: false, dryRun: false }
		});
		assert.strictEqual(error, undefined);
		assert.ok(command.includes('-PautoInstallSinglePackage'));
		assert.ok(directory.endsWith('all'));
	});

	test('builds command for core bundle (no profile, falls back to build)', () => {
		const { command, error, directory } = AemMavenHelper.buildCommand({
			cwd: fixtureRoot,
			input: 'core --build',
			opts: { skipTests: false, dryRun: false }
		});
		assert.strictEqual(error, undefined);
		assert.ok(command.startsWith('mvn clean install'));
		assert.ok(directory.endsWith('core'));
	});

	test('resolves root pom to all module if present', () => {
		const { command, error, directory } = AemMavenHelper.buildCommand({
			cwd: fixtureRoot,
			input: '',
			opts: { skipTests: false, dryRun: false }
		});
		assert.strictEqual(error, undefined);
		assert.ok(directory.endsWith('all'));
		assert.ok(command.includes('-PautoInstallSinglePackage'));
	});

	test('running from deep nested dir builds correct module', () => {
		const deepDir = path.join(fixtureRoot, 'ui.apps/deep/nested');
		const { command, error, directory } = AemMavenHelper.buildCommand({
			cwd: deepDir,
			input: '',
			opts: { skipTests: false, dryRun: false }
		});
		assert.strictEqual(error, undefined);
		assert.ok(directory.endsWith('ui.apps'));
		assert.ok(command.includes('-PautoInstallPackage'));
	});

	test('running from deep nested dir builds core with autoInstallBundle if present', () => {
		const deepDir = path.join(fixtureRoot, 'ui.apps/deep/nested');
		const { command, error, directory } = AemMavenHelper.buildCommand({
			cwd: deepDir,
			input: 'core --skip-tests --dry-run',
			opts: { skipTests: false, dryRun: false }
		});
		assert.strictEqual(error, undefined);
		assert.ok(directory.endsWith('core'));
		assert.ok(command.includes('-PautoInstallBundle'));
		assert.ok(command.includes('-DskipTests'));
		assert.ok(command.startsWith('echo [DRY RUN]'));
	});
});

suite('VS Code Extension Command (explorer/context)', () => {
	test('runs with no input when invoked from context menu (uri provided)', async () => {
		// Mock the VS Code API
		let inputBoxShown = false;
		const originalShowInputBox = vscode.window.showInputBox;
		vscode.window.showInputBox = async () => {
			inputBoxShown = true;
			return 'should-not-be-called';
		};

		// Prepare a fake URI (as if right-clicked in explorer)
		const fakeUri = vscode.Uri.file(path.join(fixtureRoot, 'ui.apps'));
		// Simulate the command handler logic
		let usedCwd = fakeUri.fsPath;
		let usedInput = '';
		let opts = { skipTests: false, dryRun: false };
		let input: string | undefined;
		if (!fakeUri) {
			input = await vscode.window.showInputBox({
				prompt: 'aem-mvn arguments (e.g. ui.apps)',
				placeHolder: '<module> [--build] [--all]'
			});
			if (input === undefined) {
				vscode.window.showInputBox = originalShowInputBox;
				return;
			}
		} else {
			input = '';
		}
		usedInput = input;
		const { command, directory, error } = AemMavenHelper.buildCommand({
			cwd: usedCwd,
			input: usedInput,
			opts
		});
		// Restore
		vscode.window.showInputBox = originalShowInputBox;
		// Assert
		assert.strictEqual(inputBoxShown, false, 'Input box should not be shown');
		assert.strictEqual(usedInput, '', 'Input should be empty string');
		assert.strictEqual(usedCwd, fakeUri.fsPath, 'cwd should be the right-clicked path');
		assert.ok(command);
	});
});
