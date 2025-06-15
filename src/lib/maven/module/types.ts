/**
 * Represents a Maven plugin entry in a pom.xml file.
 * @property artifactId - The artifact ID of the plugin.
 * @property [key: string] - Any additional plugin properties.
 */
export interface PomPlugin {
  artifactId?: string;
  [key: string]: unknown;
}

/**
 * Represents a Maven profile entry in a pom.xml file.
 * @property id - The profile ID.
 * @property [key: string] - Any additional profile properties.
 */
export interface PomProfile {
  id?: string;
  [key: string]: unknown;
}

/**
 * Represents the parsed structure of a pom.xml file.
 * @property project - The root project object, with artifactId, modules, packaging, build, profiles, etc.
 */
export interface PomXml {
  project?: {
    artifactId?: string;
    modules?: { module: string | string[] };
    packaging?: string;
    build?: { plugins?: { plugin: PomPlugin | PomPlugin[] } };
    profiles?: { profile: PomProfile | PomProfile[] };
    // ...other Maven POM fields as needed...
  };
}

/**
 * Internal type for MavenModule abstraction, representing a Maven module's metadata.
 * @property absolutePath - Absolute path to the module directory.
 * @property relativePath - Relative path from the root project.
 * @property name - Module name.
 * @property artifactId - Maven artifactId.
 * @property profiles - Effective Maven profiles for this module.
 * @property isRoot - Whether this is the root module.
 */
export interface MavenModuleData {
  absolutePath: string;
  relativePath: string;
  name: string;
  artifactId: string;
  profiles: string[];
  isRoot: boolean;
}
