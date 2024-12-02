import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejsLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as nodePath from 'node:path';
import { LambdaConstruct, LambdaConstructProps } from '.';
import * as utils from '../../../utils';

export type NodejsLambdaProps = {
    path?: string;
    basePath?: string;
    runtime?: lambda.Runtime;
    bundling?: nodejsLambda.BundlingOptions;
} & LambdaConstructProps;

export class NodejsFunctionConstruct extends LambdaConstruct {
    protected _entry: string;
    protected _bundling?: nodejsLambda.BundlingOptions;

    constructor(scope: Construct, id: string, props: NodejsLambdaProps) {
        super(scope, id, props);

        // Validate runtime
        this._runtime = props.runtime ?? lambda.Runtime.NODEJS_LATEST;

        if (!Object.values(utils.constants.NODEJS_RUNTIME).includes(this._runtime)) {
            throw TypeError(`Expected a Nodejs runtime to be given. Got ${this._runtime.name} instead.`);
        }

        const path = props.path ?? this._name;
        const basePath = props.basePath ?? utils.constants.LAMBDA_BASEPATH;
        this._entry = nodePath.join(basePath, path, 'index.ts');

        // Bundling options
        this._bundling = props.bundling;

        // Build the lambda
        this._lambda = new nodejsLambda.NodejsFunction(this, `NodejsLambda${this._id}`, {
            runtime: this._runtime,
            functionName: this._lambdaName,
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
    }
}