// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { AemMavenHelper } from './aemMavenHelper';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {


	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-aem" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('vscode-aem.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from vvvvscode-aem!');
	});

	context.subscriptions.push(disposable);

	// Register the AEM Maven Helper command
	const aemMvnDisposable = vscode.commands.registerCommand('vscode-aem.mvn', async () => {
		// Prompt for arguments (improved parsing)
		const input = await vscode.window.showInputBox({
			prompt: 'aem-mvn arguments (e.g. ui.apps --skip-tests --dry-run)',
			placeHolder: '<module> [--build] [--skip-tests] [--dry-run] [--all] [--help]'
		});
		if (input === undefined) {
			return;
		}

		// Find the workspace folder
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showErrorMessage('No workspace folder found.');
			return;
		}
		const workspaceRoot = workspaceFolders[0].uri.fsPath;

		// Argument parsing (moved to helper)
		const { moduleArg, flags } = AemMavenHelper.parseArgs(input);

		// Determine startDir: module if given, else active file, else workspace root
		let startDir = workspaceRoot;
		if (moduleArg) {
			startDir = path.join(workspaceRoot, moduleArg);
		} else {
			const activeEditor = vscode.window.activeTextEditor;
			if (activeEditor) {
				const filePath = activeEditor.document.uri.fsPath;
				startDir = path.dirname(filePath);
			}
		}

		const helper = new AemMavenHelper(workspaceRoot, startDir);
		const { moduleDir, mvnCmd, error } = helper.buildCommand(input);
		if (error) {
			vscode.window.showErrorMessage(error);
			return;
		}
		if (flags.includes('--dry-run')) {
			vscode.window.showInformationMessage(`[DRY RUN] Would run: ${mvnCmd} in ${moduleDir}`);
			return;
		}

		// Run the command in the integrated terminal
		const terminal = vscode.window.createTerminal({ name: 'AEM Maven' });
		terminal.show();
		terminal.sendText(`cd "${moduleDir}" && ${mvnCmd}`);
	});
	context.subscriptions.push(aemMvnDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
