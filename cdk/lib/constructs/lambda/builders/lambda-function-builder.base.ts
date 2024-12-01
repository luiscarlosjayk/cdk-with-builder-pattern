import * as cdk from 'aws-cdk-lib';
import { FoundationModelIdentifier } from 'aws-cdk-lib/aws-bedrock';
import * as dynamoDb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsManager from 'aws-cdk-lib/aws-secretsmanager';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { Environment, NotUndefined } from '../../../types';
import * as utils from '../../../utils';

export interface IFunctionProps {
    name: string;
    environment: Environment;
}

export abstract class LambdaFunctionBuilder extends Construct {
    protected _id: string;
    protected _name: string;
    protected _lambdaName: string;
    protected _environment: Environment;
    protected _logGroup?: lambda.FunctionProps['logGroup'];
    protected _role: NotUndefined<lambda.FunctionProps, 'role'>;
    protected _lambda: lambda.IFunction;
    protected _duration?: lambda.FunctionProps['timeout'];
    protected _memorySize?: lambda.FunctionProps['memorySize'];
    protected _concurrency?: lambda.FunctionProps['reservedConcurrentExecutions'];
    protected _environmentVariables: NotUndefined<lambda.FunctionProps, 'environment'>;
    protected _vpc?: lambda.FunctionProps['vpc'];
    protected _vpcSubnets?: lambda.FunctionProps['vpcSubnets'];
    protected _securityGroups?: lambda.FunctionProps['securityGroups'];
    protected _layers?: lambda.FunctionProps['layers'];
    protected _runtime: lambda.FunctionProps['runtime'];

    abstract build(): lambda.IFunction;

    constructor(scope: Construct, id: string, name: string, environment: Environment) {
        super(scope, id);

        this._id = id;
        this._name = name;
        this._environment = environment;
        this._lambdaName = utils.getPrefixed(name, environment);
        this._environmentVariables = {};
        this._role = new iam.Role(this, `Role${id}`, {
            assumedBy: new iam.CompositePrincipal(
                new iam.ServicePrincipal('lambda.amazonaws.com')
            ),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName(`service-role/AWSLambdaVPCAccessExecutionRole`),
            ]
        });

        const defaultPolicyStatements = this.createDefaultLambdaPolicyStatementProps();
        this._role.attachInlinePolicy(
            new iam.Policy(this, `DefaultPolicy${id}`, {
                statements: defaultPolicyStatements.map(
                    ({ effect, resources, actions }) =>
                        new iam.PolicyStatement({
                            effect,
                            resources,
                            actions
                        }),
                ),
            }),
        );

        return this;
    }

    withLogGroup(): this {
        this._logGroup = new logs.LogGroup(this, `LogGroup${this._id}`, {
            logGroupName: `/aws/lambda/${this._lambdaName}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            retention: logs.RetentionDays.ONE_WEEK,
        });

        return this;
    }

    withDuration(seconds: number): this {
        this._duration = cdk.Duration.seconds(seconds);
        return this;
    }

    withSecret(secret: secretsManager.ISecret, environmentVariable?: string): this {
        secret.grantRead(this._role);

        if (environmentVariable) {
            this.withEnvironmentVariable(environmentVariable, secret.secretName);
        }

        return this;
    }

    withSQS(queue: sqs.Queue, environmentVariable?: string): this {
        queue.grantConsumeMessages(this._role);
        queue.grantSendMessages(this._role);

        if (environmentVariable) {
            this.withEnvironmentVariable(environmentVariable, queue.queueName);
        }
        
        return this;
    }

    withDynamoDBTable(table: dynamoDb.Table, environmentVariable?: string): this {
        table.grantReadWriteData(this._role);

        if (environmentVariable) {
            this.withEnvironmentVariable(environmentVariable, table.tableName);
        }
        
        return this;
    }

    withBucket(bucket: s3.Bucket, environmentVariable?: string): this {
        bucket.grantReadWrite(this._role);

        if (environmentVariable) {
            this.withEnvironmentVariable(environmentVariable, bucket.bucketName);
        }
        
        return this;
    }

    withManagedPolicy(managedPolicy: iam.IManagedPolicy): this {
        this._role.addManagedPolicy(managedPolicy);

        return this;
    }

    withMemorySize(memorySizeInMB: number): this {
        this._memorySize = memorySizeInMB;
        return this;
    }

    withConcurrency(reservedConcurrentExecutions: number): this {
        this._concurrency = reservedConcurrentExecutions;
        return this;
    }

    withEnvironmentVariables(environmentVariables: NotUndefined<lambda.FunctionProps, 'environment'>): this {
        this._environmentVariables = {
            ...this._environmentVariables,
            ...environmentVariables,
        };
        return this;
    }

    withVpc(vpc: ec2.IVpc, securityGroups: ec2.ISecurityGroup | ec2.ISecurityGroup[], vpcSubnets?: ec2.SubnetSelection): this {
        vpcSubnets = vpcSubnets ?? { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS };
        
        securityGroups = Array.isArray(securityGroups)
            ? securityGroups
            : [securityGroups];

        this._vpc = vpc;
        this._vpcSubnets = vpcSubnets;
        this._securityGroups = securityGroups;
        return this;
    }

    withRuntime(runtime: lambda.Runtime): this {
        this._runtime = runtime;
        return this;
    }

    withEnvironmentVariable(name: string, value: string): this {
        this._environmentVariables[name] = value;
        return this;
    }

    withLayers(layers: NotUndefined<lambda.FunctionProps, 'layers'>): this {
        this._layers = layers;
        return this;
    }

    get role(): iam.IRole {
        return this._role;
    }

    protected createDefaultLambdaPolicyStatementProps(): iam.PolicyStatementProps[] {
        return [
            {
                effect: iam.Effect.ALLOW,
                resources: ['*'],
                actions: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:DescribeLogGroups',
                  'logs:DescribeLogStreams',
                  'logs:PutLogEvents'
                ]
              },
              {
                effect: iam.Effect.ALLOW,
                resources: ['*'],
                actions: [
                  'ec2:DescribeNetworkInterfaces',
                  'ec2:DetachNetworkInterface',
                  'ec2:CreateNetworkInterface',
                  'ec2:DeleteNetworkInterface',
                  'ec2:DescribeInstances',
                  'ec2:AttachNetworkInterface'
                ]
            },
        ];
    }

    protected createBedrockFoundationModelPolicyStatementProps(bedrockModelIdentifiers?: FoundationModelIdentifier[], actions?: string[]): iam.PolicyStatementProps[] {
        if (!bedrockModelIdentifiers) {
            return [];
        }
        
        actions??= [ // Default actions if none are passed
            'bedrock:InvokeModel',
            'bedrock:InvokeModelWithResponseStream',
        ];
        return bedrockModelIdentifiers.map(model => {
            return {
                effect: iam.Effect.ALLOW,
                resources: [`arn:aws:bedrock:${cdk.Aws.REGION}::foundation-model/${model.modelId}`],
                actions,
            };
        });
    }

    protected createBedrockKnowledegeBasePolicyStatementProps(knowledgeBaseIds?: string[], actions?: string[]): iam.PolicyStatementProps[] {
        if (!knowledgeBaseIds) {
            return [];
        }
        
        actions??= [ // Default actions if none are passed
            'bedrock:InvokeAgent',
            'bedrock:InvokeModelWithResponseStream',
            'bedrock:Retrieve',
            'bedrock:RetrieveAndGenerate',
            'bedrock:StartIngestionJob',
            'bedrock:StopIngestionJob',
            'bedrock:ListIngestionJobs',
        ];
        return knowledgeBaseIds.map(knowledgeBaseId => {
            return {
                effect: iam.Effect.ALLOW,
                resources: [
                    `arn:aws:bedrock:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:knowledge-base/${knowledgeBaseId}`,
                ],
                actions,
            };
        });
    }
}
