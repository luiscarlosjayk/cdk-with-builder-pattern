import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as rustLambda from 'cargo-lambda-cdk';
import { Construct } from 'constructs';
import * as nodePath from 'node:path';
import { LambdaFunction } from '.';
import type { Environment } from '../../types';
import * as utils from '../../utils';
import path = require('node:path');

export interface RustLambdaFunctionProps {
    name: string;
    environment: Environment;
}

export class RustLambdaFunction extends LambdaFunction {
    protected _lambda: rustLambda.RustFunction;
    protected _manifestPath: string;

    constructor(scope: Construct, id: string, props: RustLambdaFunctionProps) {
        super(scope, id, props.name, props.environment);
    }

    withManifest(path?: string, basePath?: string): this {
        path = path ?? this._name;
        this._manifestPath = nodePath.join(__dirname, `${basePath ?? utils.constants.LAMBDA_BASEPATH}/${path}/Cargo.toml`);
        return this;
    }

    build(): cdk.aws_lambda.IFunction {
        if (!this._manifestPath) {
            throw 'Expected manifestPath to be defined.';
        }

        this._lambda = new rustLambda.RustFunction(this, 'RustFunction', {
            functionName: this._lambdaName,
            manifestPath: this._manifestPath,
            timeout: this._duration,
            memorySize: this._memorySize,
            logGroup: this._logGroup,
            environment: this._environmentVariables,
            reservedConcurrentExecutions: this._concurrency,
            architecture: lambda.Architecture.ARM_64,
            role: this._role,
            // layers: props.layers,
            // bundling: {
            //     // ...certificatesBundlingOptions,
            //     ...props.bundling
            // },
            vpc: this._vpc,
            vpcSubnets: this._vpcSubnets,
            securityGroups: this._securityGroups,
        });

        return this._lambda;
    }
}