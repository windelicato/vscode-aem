/**
 * SdkConfig type for SDK section of config.
 */
export interface SdkConfig {
  /** AEM SDK version to use */
  version: string;
  /** Directory to download/extract the SDK */
  downloadDir: string;
  /** Port for the AEM SDK instance */
  port: number;
  /** Enable debug mode for the SDK instance */
  debug: boolean;
}
