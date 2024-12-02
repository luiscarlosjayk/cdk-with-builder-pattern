import * as pythonLambda from '@aws-cdk/aws-lambda-python-alpha';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as rustLambda from 'cargo-lambda-cdk';
import { Construct } from 'constructs';
import * as nodePath from 'node:path';
import { LambdaFunctionBuilder } from '.';
import { Environment } from '../../../types';
import * as utils from '../../../utils';

export interface PythonLambdaFunctionProps {
    name: string;
    environment: Environment;
}

export class PythonLambdaFunctionBuilder extends LambdaFunctionBuilder {
    protected _lambda: rustLambda.RustFunction;
    protected _entry: string;
    protected _handler?: string;
    protected _index?: string;

    constructor(scope: Construct, id: string, props: PythonLambdaFunctionProps) {
        super(scope, id, props.name, props.environment);

        // Defaults
        this.withHandler('handler');
        this.withEntry(this._name);
        this.withRuntime(lambda.Runtime.PYTHON_3_13);
    }

    withRuntime(runtime: lambda.Runtime): this {
        if (!Object.values(utils.constants.PYTHON_RUNTIME).includes(runtime)) {
            throw TypeError(`Expected a Python runtime to be given. Got ${runtime} instead.`);
        }
        this._runtime = runtime;
        return this;
    }

    withEntry(path: string, basePath?: string): this {
        basePath = basePath ?? utils.constants.LAMBDA_BASEPATH;
        this._entry = nodePath.join(basePath, path);
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
