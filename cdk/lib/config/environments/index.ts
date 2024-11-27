import type { Environment, EnvironmentName } from '../../types/environment';
import dev from './dev';

const ENV_NAME = process.env.ENV_NAME;

if (typeof ENV_NAME !== 'string') {
    throw TypeError('Missing ENV_NAME environment variable');
}

/**
 * @description All environments for the CDK App
 */
export const Environments = new Map<EnvironmentName, Environment>([
    ['dev', dev],
    // Add more environments here...
  ]);
  

export function getEnvironment() {
    const environment = Environments.get(ENV_NAME as EnvironmentName);

    if (!environment) {
        throw new Error(`No environment found for name: ${ENV_NAME}`);
    }

    return environment;
}
