import * as vscode from 'vscode';
import { getValidatedConfig, showInfo, showError } from '../commandUtils';

export async function status(uri?: any) {
  const config = getValidatedConfig();
  if (!config) { return; }
  const sdkHome = config.sdkHome;
  const instances = config.instances;
  let found = false;
  let statusLines: string[] = [];

  for (const instance of instances) {
    const instanceDir = `${sdkHome}/${instance.name}`;
    const pidFile = `${instanceDir}/crx-quickstart/conf/cq.pid`;
    let statusMsg = '';
    if (require('fs').existsSync(pidFile)) {
      const pid = require('fs').readFileSync(pidFile, 'utf8').trim();
      if (pid && pid.length > 0) {
        try {
          // Check if process is running
          process.kill(Number(pid), 0);
          statusMsg = `RUNNING (PID ${pid})`;
          found = true;
        } catch {
          statusMsg = 'STOPPED (PID file present, but process not running)';
        }
      } else {
        statusMsg = 'STOPPED (PID file present, but empty)';
      }
    } else {
      statusMsg = 'STOPPED (no PID file)';
    }
    statusLines.push(`[${instance.name}] ${statusMsg}`);
  }

  // Print status to VS Code output channel
  const output = vscode.window.createOutputChannel('AEM Status');
  output.clear();
  output.appendLine('AEM Instance Status:');
  for (const line of statusLines) {
    output.appendLine(line);
  }
  output.show(true);

  if (!found) {
    showInfo('No running AEM instances found.');
  }
}
