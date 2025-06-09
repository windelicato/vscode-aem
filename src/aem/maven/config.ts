// Maven-related configuration for the AEM VS Code extension

export interface MavenConfig {
	defaultGoal: 'build' | 'install';
	skipTests: boolean;
	dryRun: boolean;
}

// Only import vscode if running in VS Code (dynamic import for CLI compatibility)
let vscode: any = undefined;
try {
  vscode = require('vscode');
} catch (e) {
  // Not running in VS Code, ignore
}

export function getMavenConfig(): MavenConfig {
	// If running in VS Code, use workspace config; else, use env or defaults
	if (vscode && vscode.workspace && vscode.workspace.getConfiguration) {
		const config = vscode.workspace.getConfiguration('aemMavenHelper');
		return {
			defaultGoal: config.get('defaultGoal', 'install'),
			skipTests: config.get('skipTests', false),
			dryRun: config.get('dryRun', false),
		};
	} else {
		return {
			defaultGoal: (process.env.AEM_MAVEN_DEFAULT_GOAL as 'build' | 'install') || 'install',
			skipTests: process.env.AEM_MAVEN_SKIP_TESTS === 'true',
			dryRun: process.env.AEM_MAVEN_DRY_RUN === 'true',
		};
	}
}
