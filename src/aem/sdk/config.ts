export interface AemSDKConfig {
  authorPort: number;
  publisherPort: number;
  authorDebugPort: number;
  publisherDebugPort: number;
  sdkHome: string;
  requiredJavaVersion: number;
  passwordFile: string;
  jvmOpts: string;
  jvmDebugBaseOpts: string;
  instanceNames: string[];
}

export class AemSDKConfigHelper {
  static getConfig(): AemSDKConfig {
    // Try VS Code settings first
    let config: any = {};
    // Dynamically require vscode for CLI compatibility
    let vscode: any;
    try { vscode = require('vscode'); } catch { vscode = undefined; }
    if (vscode && vscode.workspace && vscode.workspace.getConfiguration) {
      const sdkConfig = vscode.workspace.getConfiguration('aemSDK');
      config = {
        authorPort: sdkConfig.get('authorPort', 4502),
        publisherPort: sdkConfig.get('publisherPort', 4503),
        authorDebugPort: sdkConfig.get('authorDebugPort', 5005),
        publisherDebugPort: sdkConfig.get('publisherDebugPort', 5006),
        sdkHome: sdkConfig.get('sdkHome', ''),
        requiredJavaVersion: sdkConfig.get('requiredJavaVersion', 11),
        passwordFile: sdkConfig.get('passwordFile', 'aem-password'),
        jvmOpts: sdkConfig.get('jvmOpts', '-Djava.awt.headless=true'),
        jvmDebugBaseOpts: sdkConfig.get('jvmDebugBaseOpts', '-Djava.awt.headless=true -agentlib:jdwp=transport=dt_socket,server=y,suspend=n'),
        instanceNames: sdkConfig.get('instanceNames', ['author', 'publisher'])
      };
    } else {
      // Fallback to environment variables for CLI
      config = {
        authorPort: Number(process.env.AEM_AUTHOR_PORT) || 4502,
        publisherPort: Number(process.env.AEM_PUBLISHER_PORT) || 4503,
        authorDebugPort: Number(process.env.AEM_AUTHOR_DEBUG_PORT) || 5005,
        publisherDebugPort: Number(process.env.AEM_PUBLISHER_DEBUG_PORT) || 5006,
        sdkHome: process.env.AEM_SDK_HOME || '',
        requiredJavaVersion: Number(process.env.AEM_JAVA_VERSION) || 11,
        passwordFile: process.env.AEM_PASSWORD_FILE || 'aem-password',
        jvmOpts: process.env.AEM_JVM_OPTS || '-Djava.awt.headless=true',
        jvmDebugBaseOpts: process.env.AEM_JVM_DEBUG_BASE_OPTS || '-Djava.awt.headless=true -agentlib:jdwp=transport=dt_socket,server=y,suspend=n',
        instanceNames: (process.env.AEM_INSTANCE_NAMES || 'author,publisher').split(',')
      };
    }
    return config as AemSDKConfig;
  }

  static validateConfig(config: AemSDKConfig) {
    if (!config.sdkHome) {
      throw new Error('AEM SDK: "sdkHome" is not set. Please set it in VS Code settings or the AEM_SDK_HOME environment variable.');
    }
  }
}
