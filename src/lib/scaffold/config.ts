import { FieldResolver } from '../config/types';

export interface ScaffoldConfig {
  scaffoldArgs: string;
  archetypePluginVersion: string;
}

export const scaffoldSchema: {
  [K in keyof ScaffoldConfig]: FieldResolver<ScaffoldConfig[K]>;
} = {
  scaffoldArgs: {
    env: 'AEM_SCAFFOLD_ARGS',
    default: '',
    description: 'Arguments for the scaffold command',
  },
  archetypePluginVersion: {
    env: 'AEM_SCAFFOLD_ARCHETYPE_PLUGIN_VERSION',
    default: '3.3.1',
    description: 'Version of the archetype plugin',
  },
};
