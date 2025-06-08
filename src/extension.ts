// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// Helper to find the nearest pom.xml upwards from a starting directory
import * as path from 'path';
import * as fs from 'fs';

function findNearestPom(startDir: string, workspaceRoot: string): string | null {
	let dir = startDir;
	while (dir && dir.startsWith(workspaceRoot)) {
		const pomPath = path.join(dir, 'pom.xml');
		if (fs.existsSync(pomPath)) {
			return dir;
		}
		const parent = path.dirname(dir);
		if (parent === dir) { break; }
		dir = parent;
	}
	return null;
}

// Helper to select Maven profile based on pom.xml contents
function selectProfile(moduleDir: string): string | null {
	const pomPath = path.join(moduleDir, 'pom.xml');
	const parentPomPath = path.join(moduleDir, '..', 'pom.xml');
	if (!fs.existsSync(pomPath)) { return null; }
	const pomContent = fs.readFileSync(pomPath, 'utf8');
	let parentPomContent = '';
	if (fs.existsSync(parentPomPath)) {
		parentPomContent = fs.readFileSync(parentPomPath, 'utf8');
	}
	// Prefer autoInstallSinglePackage if present
	if (pomContent.includes('<id>autoInstallSinglePackage</id>')) {
		return '-PautoInstallSinglePackage';
	}
	// Prefer autoInstallPackage for content-packages
	if (pomContent.includes('<id>autoInstallPackage</id>')) {
		return '-PautoInstallPackage';
	}
	// If no specific profile is found in the module, check content package conditions
	if (pomContent.includes('<packaging>content-package</packaging>') &&
		(pomContent.includes('<artifactId>content-package-maven-plugin</artifactId>') ||
		 pomContent.includes('<artifactId>filevault-package-maven-plugin</artifactId>'))
	) {
		return '-PautoInstallPackage';
	}
	// Prefer autoInstallBundle for bundles (with sling-maven-plugin and not content-package)
	if (parentPomContent.includes('<id>autoInstallBundle</id>') && pomContent.includes('<artifactId>sling-maven-plugin</artifactId>')) {
		return '-PautoInstallBundle';
	}
	return null;
}

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
		// Prompt for arguments (simple input for now)
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

		// Determine starting directory: active file or workspace root
		let startDir = workspaceRoot;
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			const filePath = activeEditor.document.uri.fsPath;
			startDir = path.dirname(filePath);
		}

		// Find nearest pom.xml upwards
		let moduleDir = findNearestPom(startDir, workspaceRoot);
		if (startDir === workspaceRoot) {
			moduleDir = path.join(workspaceRoot, 'all');
		}

		if (!moduleDir) {
			vscode.window.showErrorMessage('Could not find a pom.xml upwards from current directory.');
			return;
		}

		let mvnCmd = 'mvn clean install';
		let mvnCmdOpts = '';
		// Build/install for the module
		if (!input.includes('--build')) {
			const profile = selectProfile(moduleDir);
			if (profile) {
				mvnCmdOpts += ' ' + profile;
			} else {
				vscode.window.showErrorMessage("'install' command requires autoInstallSinglePackage, autoInstallBundle, or autoInstallPackage profile in pom.xml or its parent.");
				return;
			}
		}
		if (input.includes('--skip-tests')) {
			mvnCmdOpts += ' -DskipTests';
		}
		if (input.includes('--dry-run')) {
			vscode.window.showInformationMessage(`[DRY RUN] Would run: ${mvnCmd}${mvnCmdOpts} in ${moduleDir}`);
			return;
		}

		// Run the command in the integrated terminal
		const terminal = vscode.window.createTerminal({ name: 'AEM Maven' });
		terminal.show();
		terminal.sendText(`cd "${moduleDir}" && ${mvnCmd}${mvnCmdOpts}`);
	});
	context.subscriptions.push(aemMvnDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
