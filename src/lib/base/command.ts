import { ArgDefinitions, generateHelp } from "../utils/argParser";
import { ResolvedConfig, loadConfigFile } from "../config/config";

/**
 * Base class for all commands. Provides consistent argument parsing,
 * help generation, and error handling.
 */
export abstract class Command<T extends ArgDefinitions, CbType = Function> {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly arguments: T;
  protected config: ResolvedConfig;

  constructor(config?: ResolvedConfig) {
    this.config = config || loadConfigFile();
  }

  getArguments(): T {
    return this.arguments;
  }

  getHelpText(): string {
    return `${this.name}: ${this.description}\n` + generateHelp(this.arguments);
  }

  abstract create(
    input: string,
    cwd?: string
  ): Promise<{ cwd: string; command: string }>;

  abstract run(input: string, cwd?: string, callback?: CbType): Promise<void>;
}
