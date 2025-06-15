import * as vscode from 'vscode';
import { getValidatedConfig, showInfo, showError } from '../commandUtils';

export async function log(uri?: any) {
  const config = getValidatedConfig();
  if (!config) { return; }
  const sdkHome = config.sdkHome;
  const instances = config.instances;

  // Prompt user for log file name
  const logFileName = await vscode.window.showInputBox({
    prompt: 'Enter the log file name to tail (e.g. error.log, stdout.log, request.log)',
    placeHolder: 'error.log',
    value: 'error.log',
    ignoreFocusOut: true
  });
  if (!logFileName) {
    showError('No log file name provided.');
    return;
  }

  // Prepare output channel
  const output = vscode.window.createOutputChannel('AEM Log');
  output.clear();
  output.appendLine(`Tailing log file: ${logFileName}`);

  let found = false;
  const fs = require('fs');
  const { spawn } = require('child_process');

  for (const instance of instances) {
    const instanceDir = `${sdkHome}/${instance.name}`;
    const logDir = `${instanceDir}/crx-quickstart/logs`;
    const logFile = `${logDir}/${logFileName}`;
    if (fs.existsSync(logFile)) {
      found = true;
      const tail = spawn('tail', ['-F', logFile]);
      tail.stdout.on('data', (data: Buffer) => {
        output.appendLine(`[${instance.name}] ${data.toString().replace(/\n$/, '')}`);
      });
      tail.stderr.on('data', (data: Buffer) => {
        output.appendLine(`[${instance.name}][stderr] ${data.toString().replace(/\n$/, '')}`);
      });
      tail.on('close', (code: number) => {
        output.appendLine(`[${instance.name}] tail process exited with code ${code}`);
      });
    } else {
      output.appendLine(`[${instance.name}] Log file not found: ${logFile}`);
    }
  }
  output.show(true);
  if (!found) {
    showError(`No log files found for: ${logFileName}`);
  }
}
