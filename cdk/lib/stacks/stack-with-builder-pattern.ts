import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as secret from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import { PythonLambdaFunctionBuilder, RustLambdaFunctionBuilder } from '../constructs';
import { Environment } from '../types';
import { getPrefixed } from '../utils';

export interface BuilderPatternStackProps extends cdk.StackProps {
    environment: Environment;
}

export class BuilderPatternStack extends cdk.Stack {
    protected readonly id: string;
    protected readonly env: Environment;

    constructor(scope: cdk.App, id: string, props: BuilderPatternStackProps) {
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
        const simplePythonLambda = new PythonLambdaFunctionBuilder(this, 'SimplePythonLambda', {
            name: 'dummy-python-lambda',
            environment: props.environment,
        })
        .build();

        const complexPythonLambda = new PythonLambdaFunctionBuilder(this, 'MoreComplexPythonLambda', {
            name: 'more-complex-lambda',
            environment: props.environment,
        })
        .withLogGroup()
        .withEntry('dummy-python-lambda')
        .withIndex('index.py')
        .withHandler('handler')
        .withDuration(90)
        .withSecret(mySecret, 'SECRET_NAME')
        .withLayers([
            myLambdaLayer,
        ])
        .withManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonBedrockFullAccess'),
        )
        .withManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        )
        .build();

        const simpleRustLambda = new RustLambdaFunctionBuilder(this, 'SimpleRustLambda', {
            name: 'dummy-rust-lambda',
            environment: props.environment,
        })
        .build();
        
        const complexRustLambda = new RustLambdaFunctionBuilder(this, 'SimpleRustLambda', {
            name: 'complex-rust-lambda',
            environment: props.environment,
        })
        .withManifest('dummy-rust-lambda')
        .withLogGroup()
        .withDuration(90)
        .withSecret(mySecret, 'SECRET_NAME')
        .withLayers([
            myLambdaLayer,
        ])
        .withManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonBedrockFullAccess'),
        )
        .withManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        )
        .build();

        /**
         * Stack Exports
         */
        new cdk.CfnOutput(this, 'SimplePythonComplexLambdaARN', {
            exportName: getPrefixed('simple-python-lambda-arn', props.environment),
            value: simplePythonLambda.functionArn,
        });

        new cdk.CfnOutput(this, 'ComplexPythonLambdaARN', {
            exportName: getPrefixed('complex-python-lambda-arn', props.environment),
            value: complexPythonLambda.functionArn,
        });

        new cdk.CfnOutput(this, 'SimpleRustLambdaARN', {
            exportName: getPrefixed('simple-rust-lambda-arn', props.environment),
            value: simpleRustLambda.functionArn,
        });

        new cdk.CfnOutput(this, 'ComplexRustLambdaARN', {
            exportName: getPrefixed('complex-rust-lambda-arn', props.environment),
            value: complexRustLambda.functionArn,
        });
    }
}
