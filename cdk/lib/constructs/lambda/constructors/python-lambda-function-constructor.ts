import * as pythonLambda from '@aws-cdk/aws-lambda-python-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as nodePath from 'node:path';
import { LambdaConstruct, LambdaConstructProps } from '.';
import * as utils from '../../../utils';

export type PythonLambdaProps = {
    path?: string;
    index?: pythonLambda.PythonFunctionProps['index'];
    handler?: pythonLambda.PythonFunctionProps['handler'];
    runtime?: lambda.Runtime;
    basePath?: string;
} & LambdaConstructProps;

export class PythonFunctionConstruct extends LambdaConstruct {
    protected _entry: string;
    protected _index?: string;
    protected _handler?: string;

    constructor(scope: Construct, id: string, props: PythonLambdaProps) {
        super(scope, id, props);

        // Validate runtime
        this._runtime = props.runtime ?? lambda.Runtime.PYTHON_3_13;

        if (!Object.values(utils.constants.PYTHON_RUNTIME).includes(this._runtime)) {
            throw TypeError(`Expected a Python runtime to be given. Got ${this._runtime.name} instead.`);
        }

        this._index = props.index;
        this._handler = props.handler;

        // Validate path
        const path = props.path ?? this._name;
        const basePath = props.basePath ?? utils.constants.LAMBDA_BASEPATH;
        this._entry = nodePath.join(basePath, path);

        // Build the lambda
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
    }
}
