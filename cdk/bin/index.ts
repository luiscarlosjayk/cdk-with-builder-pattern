#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { getEnvironment } from '../lib/config/environments';
import { GithubOIDCStack, PipelinesStack } from '../lib/stacks';
import { loadEnvFile } from '../lib/utils';
import { getPrefixed } from '../lib/utils/prefix';

// Load .env file
if ('LOAD_ENVFILE' in process.env) {
    loadEnvFile();
}

const AWS_ACCOUNT = process.env.AWS_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT;
const AWS_REGION = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION;
const PROJECT_OWNER = process.env.PROJECT_OWNER ? { OWNER: process.env.PROJECT_OWNER } : null;

const environment = getEnvironment();
const app = new cdk.App();
const env = {
    account: AWS_ACCOUNT,
    region: AWS_REGION,
};
const tags = {
    ...PROJECT_OWNER,
    APP: environment.appName,
};

/**
 * Stack following Builder Pattern
 */
const builderPatternStackName = getPrefixed('stack-with-builder-pattern', environment);
new BuilderPatternStack(app, 'PipelinesStack', {
    stackName: builderPatternStackName,
    environment,
    env,
    // Set tags for all resources in the stack
    tags: { ...tags, STACK: builderPatternStackName },
});

/**
 * Stack with All-In Constructor
 */
const noBuilderPatternStackName = getPrefixed('stack-with-allin-constructor', environment);
new AllInConstructorStack(app, 'PipelinesStack', {
    stackName: noBuilderPatternStackName,
    environment,
    env,
    // Set tags for all resources in the stack
    tags: { ...tags, STACK: noBuilderPatternStackName },
});

app.synth();