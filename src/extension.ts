import * as vscode from 'vscode';
import * as path from 'path';
import { AemMavenHelper } from './aemMavenHelper';

export function activate(context: vscode.ExtensionContext) {

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

		// Always pass cwd (directory of open file in vscode) to constructor
		let cwd = workspaceRoot;
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			const filePath = activeEditor.document.uri.fsPath;
			cwd = path.dirname(filePath);
		}
		const helper = new AemMavenHelper(cwd);
		helper.parseInputArgs(input);
		const { command, directory, error } = helper.buildCommand();
		if (error) {
			vscode.window.showErrorMessage(error);
			return;
		}
		if (command.startsWith('echo ')) {
			vscode.window.showInformationMessage(command.replace('echo ', ''));
			return;
		}

		// Run the command in the integrated terminal
		const terminal = vscode.window.createTerminal({ name: 'AEM Maven' });
		terminal.show();
		terminal.sendText(`cd "${directory}" && ${command}`);
	});
	context.subscriptions.push(aemMvnDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
