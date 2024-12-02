import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as secret from 'aws-cdk-lib/aws-secretsmanager';
import { GoLambdaFunctionBuilder, NodejsLambdaFunctionBuilder, PythonLambdaFunctionBuilder, RustLambdaFunctionBuilder } from '../constructs';
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
        const mySecret = new secret.Secret(this, `Secret${id}`, {
            secretName: getPrefixed('builder-pattern-secret', this.env),
        });

        /**
         * Lambda Layers
         * 
         * Reference: https://docs.aws.amazon.com/systems-manager/latest/userguide/ps-integration-lambda-extensions.html#ps-integration-lambda-extensions-add
         */
        const myLambdaLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'ParametersSecretsLayer', 'arn:aws:lambda:us-east-1:177933569100:layer:AWS-Parameters-and-Secrets-Lambda-Extension:12');

        /**
         * Lambdas
         */
        const simplePythonLambda = new PythonLambdaFunctionBuilder(this, 'BuilderSimplePythonLambda', {
            name: 'dummy-python-lambda',
            environment: props.environment,
        })
            .build();

        const complexPythonLambda = new PythonLambdaFunctionBuilder(this, 'BuilderComplexPythonLambda', {
            name: 'complex-builder-python',
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

        const simpleRustLambda = new RustLambdaFunctionBuilder(this, 'BuilderSimpleRustLambda', {
            name: 'dummy-rust-lambda',
            environment: props.environment,
        })
            .build();
        
        const complexRustLambda = new RustLambdaFunctionBuilder(this, 'BuilderComplexRustLambda', {
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

        const simpleGoLambda = new GoLambdaFunctionBuilder(this, 'BuilderSimpleGoLambda', {
            name: 'dummy-go-lambda',
            environment: props.environment,
        })
            .build();

        const simpleNodejsLambda = new NodejsLambdaFunctionBuilder(this, 'BuilderSimpleNodejsLambda', {
            name: 'dummy-nodejs-lambda',
            environment: props.environment,
        })
            .build();

        /**
         * Stack Exports
         */
        new cdk.CfnOutput(this, 'BuilderSimplePythonLambdaARN', {
            exportName: getPrefixed('builder-simple-python-lambda-arn', props.environment),
            value: simplePythonLambda.functionArn,
        });

        new cdk.CfnOutput(this, 'BuilderComplexPythonLambdaARN', {
            exportName: getPrefixed('builder-complex-python-lambda-arn', props.environment),
            value: complexPythonLambda.functionArn,
        });

        new cdk.CfnOutput(this, 'BuilderSimpleRustLambdaARN', {
            exportName: getPrefixed('builder-simple-rust-lambda-arn', props.environment),
            value: simpleRustLambda.functionArn,
        });

        new cdk.CfnOutput(this, 'BuilderComplexRustLambdaARN', {
            exportName: getPrefixed('builder-complex-rust-lambda-arn', props.environment),
            value: complexRustLambda.functionArn,
        });

        new cdk.CfnOutput(this, 'BuilderSimpleGoLambdaARN', {
            exportName: getPrefixed('builder-simple-go-lambda-arn', props.environment),
            value: simpleGoLambda.functionArn,
        });

        new cdk.CfnOutput(this, 'BuilderSimpleNodejsLambdaARN', {
            exportName: getPrefixed('builder-simple-nodejs-lambda-arn', props.environment),
            value: simpleNodejsLambda.functionArn,
        });
    }
}
