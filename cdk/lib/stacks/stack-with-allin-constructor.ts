import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as secret from 'aws-cdk-lib/aws-secretsmanager';
import { PythonLambdaFunction } from '../constructs';
import { Environment } from '../types';
import { getPrefixed } from '../utils';

export interface AllInConstructorStackProps extends cdk.StackProps {
    environment: Environment;
}

export class AllInConstructorStack extends cdk.Stack {
    protected readonly id: string;
    protected readonly env: Environment;

    constructor(scope: cdk.App, id: string, props: AllInConstructorStackProps) {
        super(scope, id);

        this.env = props.environment;
        this.id = id;

        /**
         * Secrets
         */
        const mySecret = secret.Secret.fromSecretNameV2(this, 'MySecret', 'dev/my-application/my-secret');

        /**
         * Lambda Layers
         */
        const myLambdaLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'MyLambdaLayer', 'arn:aws:lambda:::layer:my-lambda-layer:1');

        /**
         * Lambdas
         */
        

        /**
         * Stack Exports
         */
        // new cdk.CfnOutput(this, 'SimplePythonComplexLambdaARN', {
        //     exportName: getPrefixed('simple-python-lambda-arn', props.environment),
        //     value: simplePythonLambda.functionArn,
        // });

        // new cdk.CfnOutput(this, 'ComplexPythonLambdaARN', {
        //     exportName: getPrefixed('complex-python-lambda-arn', props.environment),
        //     value: complexPythonLambda.functionArn,
        // });
    }
}
