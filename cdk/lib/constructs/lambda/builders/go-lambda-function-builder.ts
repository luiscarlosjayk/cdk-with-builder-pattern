import * as goLambda from '@aws-cdk/aws-lambda-go-alpha';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as nodePath from 'node:path';
import { LambdaFunctionBuilder } from '..';
import type { Environment } from '../../../types';
import * as utils from '../../../utils';

export interface GoLambdaFunctionProps {
    name: string;
    environment: Environment;
}

export class GoLambdaFunctionBuilder extends LambdaFunctionBuilder {
    protected _lambda: goLambda.GoFunction;
    protected _entry: string;
    protected _moduleDir?: string;

    constructor(scope: Construct, id: string, props: GoLambdaFunctionProps) {
        super(scope, id, props.name, props.environment);

        // Defaults
        this.withEntry(this._name);
        this.withModuleDir(this._name);
    }

    withEntry(path: string, basePath?: string): this {
        basePath = basePath ?? utils.constants.LAMBDA_BASEPATH;
        this._entry = nodePath.join(__dirname, `../${basePath}/${path}`);
        return this;
    }

    withModuleDir(path: string, basePath?: string): this {
        basePath = basePath ?? utils.constants.LAMBDA_BASEPATH;
        this._moduleDir = nodePath.join(__dirname, `../${basePath}/${path}`);
        return this;
    }

    build(): cdk.aws_lambda.IFunction {
        if (!this._entry) {
            throw 'Expected entry to be defined.';
        }

        if (!this._moduleDir) {
            throw 'Expected moduleDir to be defined.';
        }

        this._lambda = new goLambda.GoFunction(this, `GoLambda${this._id}`, {
            functionName: this._lambdaName,
            entry: this._entry,
            moduleDir: this._moduleDir,
            timeout: this._duration,
            memorySize: this._memorySize,
            logGroup: this._logGroup,
            environment: this._environmentVariables,
            reservedConcurrentExecutions: this._concurrency,
            architecture: lambda.Architecture.ARM_64,
            role: this._role,
            vpc: this._vpc,
            vpcSubnets: this._vpcSubnets,
            securityGroups: this._securityGroups,
            layers: this._layers,
        });

        return this._lambda;
    }
}