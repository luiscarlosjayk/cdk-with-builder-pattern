import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as rustLambda from 'cargo-lambda-cdk';
import { Construct } from 'constructs';
import * as nodePath from 'node:path';
import { LambdaConstruct, LambdaConstructProps } from '.';
import * as utils from '../../../utils';

export type RustLambdaProps = {
    path?: string;
    basePath?: string;
} & LambdaConstructProps;

export class RustFunctionConstruct extends LambdaConstruct {
    protected _manifestPath: string;

    constructor(scope: Construct, id: string, props: RustLambdaProps) {
        super(scope, id, props);

        const path = props.path ?? this._name;
        const basePath = props.basePath ?? utils.constants.LAMBDA_BASEPATH;
        this._manifestPath = nodePath.join(__dirname, `../${basePath}/${path}/Cargo.toml`);

        // Build the lambda
        this._lambda = new rustLambda.RustFunction(this, `RustLambda${this._id}`, {
            functionName: this._lambdaName,
            manifestPath: this._manifestPath,
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
    }
}