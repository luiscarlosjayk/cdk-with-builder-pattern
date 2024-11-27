import * as pythonLambda from '@aws-cdk/aws-lambda-python-alpha';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as rustLambda from 'cargo-lambda-cdk';
import { Construct } from 'constructs';
import * as nodePath from 'node:path';
import { LambdaFunction } from '.';
import type { Environment } from '../../types';
import * as utils from '../../utils';

export interface PythonLambdaFunctionProps {
    name: string;
    environment: Environment;
}

export class PythonLambdaFunction extends LambdaFunction {
    protected _lambda: rustLambda.RustFunction;
    protected _entry: string;
    protected _handler?: string;
    protected _index?: string;

    constructor(scope: Construct, id: string, props: PythonLambdaFunctionProps) {
        super(scope, id, props.name, props.environment);

        // Defaults
        this.withEntry(this._name);
        this.withRuntime(lambda.Runtime.PYTHON_3_13);
    }

    withEntry(path: string, basePath?: string): this {
        this._entry = nodePath.join(__dirname, `../${basePath ?? utils.constants.LAMBDA_BASEPATH}/${path}`);

        return this;
    }

    withIndex(index: string): this {
        this._index = index;
        return this;
    }

    withHandler(handler: string): this {
        this._handler = handler;
        return this;
    }

    build(): cdk.aws_lambda.IFunction {
        if (!this._entry) {
            throw 'Expected entry to be defined.';
        }

        this._lambda = new pythonLambda.PythonFunction(this, `PythonLambda${this._id}`, {
            runtime: this._runtime,
            entry: this._entry,
            index: this._index,
            handler: this._handler,
            functionName: this._lambdaName,
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