import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejsLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as nodePath from 'node:path';
import { LambdaFunctionBuilder } from '.';
import type { Environment } from '../../../types';
import * as utils from '../../../utils';

export interface NodejsLambdaFunctionProps {
    name: string;
    environment: Environment;
}

export class NodejsLambdaFunctionBuilder extends LambdaFunctionBuilder {
    protected _lambda: nodejsLambda.NodejsFunction;
    protected _entry: string;
    protected _handler: string;
    protected _bundling?: nodejsLambda.BundlingOptions;

    constructor(scope: Construct, id: string, props: NodejsLambdaFunctionProps) {
        super(scope, id, props.name, props.environment);

        // Defaults
        this.withHandler('handler');
        this.withEntry(this._name);
        this.withRuntime(lambda.Runtime.NODEJS_LATEST);
    }

    withRuntime(runtime: lambda.Runtime): this {
        if (!Object.values(utils.constants.NODEJS_RUNTIME).includes(runtime)) {
            throw TypeError(`Expected a Nodejs runtime to be given. Got ${runtime.name} instead.`);
        }
        this._runtime = runtime;
        return this;
    }

    withHandler(handler: string): this {
        this._handler = handler;
        return this;
    }

    withEntry(path: string, basePath?: string): this {
        basePath = basePath ?? utils.constants.LAMBDA_BASEPATH;
        this._entry = nodePath.join(basePath, path, 'index.ts');
        return this;
    }

    build(): cdk.aws_lambda.IFunction {
        if (!this._entry) {
            throw 'Expected entry to be defined.';
        }

        this._lambda = new nodejsLambda.NodejsFunction(this, `NodejsLambda${this._id}`, {
            runtime: this._runtime,
            functionName: this._lambdaName,
            handler: this._handler,
            entry: this._entry,
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
            bundling: this._bundling,
        });

        return this._lambda;
    }
}