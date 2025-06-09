import * as vscode from 'vscode';
import * as path from 'path';
import { AemMavenHelper } from './aem/maven/helper';
import { AemSDKHelper } from './aem/sdk/helper';
import { stop } from './aem/sdk/commands/stop';

export function activate(context: vscode.ExtensionContext) {

	// Register the AEM Maven Helper command
	const aemMvnDisposable = vscode.commands.registerCommand('vscode-aem.mvn', async (uri?: vscode.Uri) => {
		let input: string | undefined;
		// If invoked from the context menu, do not show the input box
		if (!uri) {
			input = await vscode.window.showInputBox({
				prompt: 'aem-mvn arguments (e.g. install, build, all, skip-tests, dry-run, or a target module name)',
				placeHolder: 'install | build | all | skip-tests | dry-run | <target module>'
			});
			if (input === undefined) {
				return;
			}
		} else {
			// Default to no arguments if run from context menu
			input = '';
		}

		// Find the workspace folder
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showErrorMessage('No workspace folder found.');
			return;
		}
		const workspaceRoot = workspaceFolders[0].uri.fsPath;

		// Use the right-clicked file/folder as cwd if available
		let cwd = workspaceRoot;
		if (uri && uri.fsPath) {
			cwd = uri.fsPath;
		} else {
			const activeEditor = vscode.window.activeTextEditor;
			if (activeEditor) {
				const filePath = activeEditor.document.uri.fsPath;
				cwd = path.dirname(filePath);
			}
		}

		// Use AemMavenHelper to build the command and directory
		const { command, directory, error } = AemMavenHelper.buildCommand({
			cwd,
			input: input || ''
		});
		if (error) {
			vscode.window.showErrorMessage(error);
			return;
		}
		if (command.startsWith('echo ')) {
			vscode.window.showInformationMessage(command.replace('echo ', ''));
			return;
		}
		const terminal = vscode.window.createTerminal({ name: 'AEM Maven' });
		terminal.show();
		terminal.sendText(`cd "${directory}" && ${command}`);
	});
	context.subscriptions.push(aemMvnDisposable);

	// Check for required SDK settings before registering SDK commands
	const sdkConfig = vscode.workspace.getConfiguration('aemSDK');
	const sdkHome = sdkConfig.get<string>('sdkHome', '');
	if (!sdkHome) {
		vscode.window.showWarningMessage('AEM SDK: Please set "aemSDK.sdkHome" in your VS Code settings before using SDK commands.');
	} else {
		context.subscriptions.push(
			vscode.commands.registerCommand('vscode-aem.sdk.setup', AemSDKHelper.setup),
			vscode.commands.registerCommand('vscode-aem.sdk.start', AemSDKHelper.start),
			vscode.commands.registerCommand('vscode-aem.sdk.status', AemSDKHelper.status),
			vscode.commands.registerCommand('vscode-aem.sdk.log', AemSDKHelper.log),
			vscode.commands.registerCommand('vscode-aem.sdk.stop', AemSDKHelper.stop),
		);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
