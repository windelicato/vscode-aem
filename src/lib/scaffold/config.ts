import { FieldResolver } from "../config/types";

export interface ScaffoldConfig {
  scaffoldArgs: string;
  archetypePluginVersion: string;
}

export const scaffoldSchema: {
  [K in keyof ScaffoldConfig]: FieldResolver<ScaffoldConfig[K]>;
} = {
  scaffoldArgs: {
    env: "AEM_SCAFFOLD_ARGS",
    default:
      '-DarchetypeGroupId=com.adobe.aem \n-DarchetypeArtifactId=aem-project-archetype \n-DarchetypeVersion=53 \n-DgroupId=com.{packageName} \n-DartifactId={packageName} \n-Dversion=1.0-SNAPSHOT \n-Dpackage=com.{packageName} \n-DappId={packageName} \n-DappTitle="{appTitle}" \n-DfrontendModule=general \n-DsingleCountry=y \n-DincludeExamples=n \n-DincludeErrorHandler=n \n-DincludeDispatcherConfig=n \n-DincludeCif=n \n-DincludeForms=n \n-DincludeFormsenrollment=y \n-DincludeFormscommunications=y \n-DsdkFormsVersion=latest \n-DcommerceEndpoint=https://hostname.com/graphql \n-Ddatalayer=y \n-Damp=n \n-DenableDynamicMedia=y \n-DenableSSR=n \n-DprecompiledScripts=n \n-DuiTestingFramework=cypress',
    description: "Arguments for the scaffold command",
  },
  archetypePluginVersion: {
    env: "AEM_SCAFFOLD_ARCHETYPE_PLUGIN_VERSION",
    default: "3.3.1",
    description: "Version of the archetype plugin",
  },
};
