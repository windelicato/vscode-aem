/**
 * ScaffoldConfig type for Scaffold section of config.
 */
export interface ScaffoldConfig {
  /** Name of the scaffold template */
  template: string;
  /** Output directory for scaffolded files */
  outputDir: string;
  /** Whether to overwrite existing files */
  force: boolean;
}
