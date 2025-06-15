import type { PomPlugin, PomProfile, PomXml } from "./types";

/**
 * Converts a value or array to an array, or returns an empty array if undefined.
 * @param val - The value or array to normalize.
 * @returns An array of values.
 */
function toArray<T>(val: T | T[] | undefined): T[] {
  if (!val) {
    return [];
  }
  return Array.isArray(val) ? val : [val];
}

/**
 * Resolves the effective Maven profiles for a module, given its parsed pom.xml and (optionally) its parent's pom.xml.
 *
 * @param pom The parsed pom.xml for the module.
 * @param parentPom The parsed pom.xml for the parent directory/module.
 * @param isRoot Whether this module is the root project.
 * @returns An array of effective Maven profile IDs.
 */
export function resolveProfiles(
  pom: PomXml,
  parentPom?: PomXml,
  isRoot = false
): string[] {
  const profiles: string[] = [];

  // Normalize profiles
  const moduleProfiles = toArray<PomProfile>(pom.project?.profiles?.profile);
  const parentProfiles = toArray<PomProfile>(
    parentPom?.project?.profiles?.profile
  );

  // 1. Prefer autoInstallSinglePackage if present in module
  if (moduleProfiles.some((prof) => prof?.id === "autoInstallSinglePackage")) {
    profiles.push("autoInstallSinglePackage");
  }
  // Always add autoInstallSinglePackage for root pom
  if (isRoot && !profiles.includes("autoInstallSinglePackage")) {
    profiles.push("autoInstallSinglePackage");
  }
  // 2. Prefer autoInstallPackage if present in module
  if (moduleProfiles.some((prof) => prof?.id === "autoInstallPackage")) {
    profiles.push("autoInstallPackage");
  }

  // 3. If no specific profile, check content-package conditions
  const packaging = pom.project?.packaging;
  const pluginsArr = toArray<PomPlugin>(pom.project?.build?.plugins?.plugin);
  if (
    packaging === "content-package" &&
    pluginsArr.some(
      (p) =>
        p?.artifactId === "content-package-maven-plugin" ||
        p?.artifactId === "filevault-package-maven-plugin"
    )
  ) {
    if (!profiles.includes("autoInstallPackage")) {
      profiles.push("autoInstallPackage");
    }
  }

  // 4. Prefer autoInstallBundle for bundles (with sling-maven-plugin and not content-package)
  const hasAutoInstallBundle = parentProfiles.some(
    (prof) => prof?.id === "autoInstallBundle"
  );
  if (hasAutoInstallBundle && packaging !== "content-package") {
    profiles.push("autoInstallBundle");
  }

  return profiles;
}
