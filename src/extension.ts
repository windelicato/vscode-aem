import * as vscode from 'vscode';
import * as path from 'path';
import { AemMavenHelper } from './aem/maven/helper';
import { AemSDKHelper } from './aem/sdk/helper';

export function activate(context: vscode.ExtensionContext) {

	// Register the AEM Maven Helper command
	const aemMvnDisposable = vscode.commands.registerCommand('vscode-aem.mvn', async (uri?: vscode.Uri) => {
		let input: string | undefined;
		// If invoked from the context menu, do not show the input box
		if (!uri) {
			input = await vscode.window.showInputBox({
				prompt: 'aem-mvn arguments (e.g. ui.apps)',
				placeHolder: '<module> [--build] [--all]'
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

		// Read settings for skipTests and dryRun
		const config = vscode.workspace.getConfiguration('aemMavenHelper');
		const skipTests = config.get<boolean>('skipTests', false);
		const dryRun = config.get<boolean>('dryRun', false);

		const { command, directory, error } = AemMavenHelper.buildCommand({
			cwd,
			input,
			opts: { skipTests, dryRun }
		});
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
			vscode.commands.registerCommand('vscode-aem.sdk.log', AemSDKHelper.log)
		);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
