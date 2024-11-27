import type { Environment } from '../types/environment';

export function getSSMPrefixed(name: string, environment: Environment): string {
    return `/${environment.appName}-${environment.envName}/${name}`.toLowerCase();
}

export function getPrefixed(name: string, environment: Environment): string {
    return `${environment.orgName}-${environment.appName}-${environment.envName}-${name}`.toLowerCase();
}
