import * as assert from 'assert';
import * as vscode from 'vscode';
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
