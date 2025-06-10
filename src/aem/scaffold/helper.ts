import * as vscode from 'vscode';

export class AemScaffoldHelper {
  static async runScaffold() {
    // Prompt for App Title
    const appTitle = await vscode.window.showInputBox({
      prompt: 'Enter the App Title',
      ignoreFocusOut: true
    });
    if (!appTitle) {
      vscode.window.showWarningMessage('App Title is required.');
      return;
    }
    // Prompt for Java package name
    let packageName = await vscode.window.showInputBox({
      prompt: "Short Name (e.g., mysite). Used as 'com.<yours>' for groupId/package, '<yours>' for appId/artifactId.",
      ignoreFocusOut: true
    });
    if (!packageName) {
      vscode.window.showWarningMessage('Java package name is required.');
      return;
    }
    if (/\s/.test(packageName)) {
      vscode.window.showWarningMessage('Java package name cannot contain spaces.');
      return;
    }
    // Use settings for all other options, inject package name and archetype version
    const config = vscode.workspace.getConfiguration('aemScaffold');
    let scaffoldArgs = config.get<string>('scaffoldArgs', '');
    let archetypeVersion = config.get<string>('archetypePluginVersion', '');
    scaffoldArgs = scaffoldArgs.replace(/\{packageName\}/g, packageName);
    scaffoldArgs = scaffoldArgs.replace(/\{appTitle\}/g, appTitle);
    // Normalize scaffoldArgs: replace newlines and backslashes with spaces
    scaffoldArgs = scaffoldArgs.replace(/\\\n/g, ' ') // handle backslash-newline (line continuation)
                           .replace(/\n/g, ' ')   // handle plain newlines
                           .replace(/\\/g, ' ');  // handle stray backslashes
    scaffoldArgs = scaffoldArgs.replace(/\s+/g, ' ').trim();
    // Compose the command
    const command = `mvn -B org.apache.maven.plugins:maven-archetype-plugin:${archetypeVersion}:generate ${scaffoldArgs}`;
    let terminal = vscode.window.terminals.find(t => t.name === 'AEM Scaffold');
    if (!terminal) {
      terminal = vscode.window.createTerminal({ name: 'AEM Scaffold' });
    }
    terminal.show();
    terminal.sendText(command);
  }
}
