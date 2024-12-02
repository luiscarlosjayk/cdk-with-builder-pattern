import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as secret from 'aws-cdk-lib/aws-secretsmanager';
import { GoFunctionConstruct, NodejsFunctionConstruct, PythonFunctionConstruct, RustFunctionConstruct } from '../constructs/lambda/constructors';
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
        const mySecret = new secret.Secret(this, `Secret${id}`, {
            secretName: getPrefixed('constructor-pattern-secret', this.env),
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
        const simplePythonLambda = new PythonFunctionConstruct(this, 'SimpleConstructorPythonLambda', {
            name: 'dummy-constructor-python-lambda',
            environment: this.env,
            path: 'dummy-python-lambda',
        });

        const complexPythonLambda = new PythonFunctionConstruct(this, 'ComplexConstructorPythonLambda', {
            name: 'complex-constructor-python-lambda',
            environment: this.env,
            withLogGroup: true,
            path: 'dummy-python-lambda',
            secrets: [{ secret: mySecret, environmentVariable: 'SECRET_NAME' }],
            layers: [myLambdaLayer],
            duration: cdk.Duration.seconds(90),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonBedrockFullAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
            ],
        });
        
        const simpleRustLambda = new RustFunctionConstruct(this, 'ConstructorSimpleRustLambda', {
            name: 'dummy-constructor-rust-lambda',
            path: 'dummy-rust-lambda',
            environment: this.env,
        });

        const simpleGoLambda = new GoFunctionConstruct(this, 'ConstructorSimpleGoLambda', {
            name: 'dummy-constructor-go-lambda',
            path: 'dummy-go-lambda',
            environment: this.env,
        });

        const simpleNodejsLambda = new NodejsFunctionConstruct(this, 'ConstructorSimpleNodejsLambda', {
            name: 'dummy-constructor-nodejs-lambda',
            path: 'dummy-nodejs-lambda',
            environment: this.env,
        });

        /**
         * Stack Exports
         */
        new cdk.CfnOutput(this, 'SimpleConstructorPythonLambdaARN', {
            exportName: getPrefixed('constructor-simple-python-lambda-arn', props.environment),
            value: simplePythonLambda.lambda.functionArn,
        });

        new cdk.CfnOutput(this, 'ConstructorComplexPythonLambdaARN', {
            exportName: getPrefixed('constructor-complex-python-lambda-arn', props.environment),
            value: complexPythonLambda.lambda.functionArn,
        });

        new cdk.CfnOutput(this, 'ConstructorSimpleRustLambdaARN', {
            exportName: getPrefixed('constructor-simple-rust-lambda-arn', props.environment),
            value: simpleRustLambda.lambda.functionArn,
        });

        new cdk.CfnOutput(this, 'ConstructorSimpleGoLambdaARN', {
            exportName: getPrefixed('constructor-simple-go-lambda-arn', props.environment),
            value: simpleGoLambda.lambda.functionArn,
        });

        new cdk.CfnOutput(this, 'ConstructorSimpleNodejsLambdaARN', {
            exportName: getPrefixed('constructor-simple-nodejs-lambda-arn', props.environment),
            value: simpleNodejsLambda.lambda.functionArn,
        });
    }
}
