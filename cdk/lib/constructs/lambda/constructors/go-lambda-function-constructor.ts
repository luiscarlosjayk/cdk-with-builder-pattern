import * as goLambda from '@aws-cdk/aws-lambda-go-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as nodePath from 'node:path';
import { LambdaConstruct, LambdaConstructProps } from '.';
import * as utils from '../../../utils';

export type GoLambdaProps = {
    path?: string;
    basePath?: string;
    moduleDir?: string;
} & LambdaConstructProps;

export class GoFunctionConstruct extends LambdaConstruct {
    protected _entry: string;
    protected _moduleDir: string;

    constructor(scope: Construct, id: string, props: GoLambdaProps) {
        super(scope, id, props);

        const path = props.path ?? this._name;
        const basePath = props.basePath ?? utils.constants.LAMBDA_BASEPATH;
        const moduleDirPath = props.moduleDir ?? basePath;
        this._entry = nodePath.join(basePath, path, 'main.go');
        this._moduleDir = nodePath.join(moduleDirPath, path, 'go.mod');

        // Build the lambda
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
    }
}
