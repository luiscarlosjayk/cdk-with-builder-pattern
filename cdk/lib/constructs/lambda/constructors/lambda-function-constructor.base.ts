import * as cdk from 'aws-cdk-lib';
import { FoundationModelIdentifier } from 'aws-cdk-lib/aws-bedrock';
import * as dynamoDB from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsManager from 'aws-cdk-lib/aws-secretsmanager';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { Environment, NotUndefined } from '../../../types';
import { getPrefixed } from '../../../utils';

export interface LambdaConstructProps {
    name: string;
    environment: Environment;
    withLogGroup: boolean;
    duration?: lambda.FunctionProps['timeout'];
    memorySize?: lambda.FunctionProps['memorySize'];
    concurrency?: lambda.FunctionProps['reservedConcurrentExecutions'];
    environmentVariables?: lambda.FunctionProps['environment'];
    vpc?: lambda.FunctionProps['vpc'];
    vpcSubnets?: lambda.FunctionProps['vpcSubnets'];
    securityGroups?: lambda.FunctionProps['securityGroups'];
    layers?: lambda.FunctionProps['layers'];
    secrets?: { secret: secretsManager.ISecret, environmentVariable?: string }[];
    buckets?: { bucket: s3.Bucket, environmentVariable?: string }[];
    sqs?: { queue: sqs.Queue, environmentVariable?: string }[];
    dynamoDBTables?: { table: dynamoDB.Table, environmentVariable?: string }[];
    managedPolicies?: iam.IManagedPolicy[];
}


export class LambdaConstruct extends Construct {
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

    constructor(scope: Construct, id: string, props: LambdaConstructProps) {
        super(scope, id);
        this._id = id;
        this._environment = props.environment;
        this._name = props.name;
        this._lambdaName = getPrefixed(this._name, this._environment);
        this._duration = props.duration;
        this._memorySize = props.memorySize;
        this._concurrency = props.concurrency;
        this._environmentVariables = Object.assign({}, props.environmentVariables);
        this._vpc = props.vpc;
        this._vpcSubnets = props.vpcSubnets;
        this._securityGroups = props.securityGroups;
        this._layers = props.layers;

        if (props.withLogGroup) {
            this._logGroup = new logs.LogGroup(this, `LogGroup${id}`, {
                logGroupName: `/aws/lambda/${this._lambdaName}`,
                removalPolicy: cdk.RemovalPolicy.DESTROY,
                retention: logs.RetentionDays.ONE_WEEK,
            });
        }

        /**
         * IAM base role
         */
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

        /**
         * Grant secrets read permissions and add to environment variales
         */
        if (props.secrets) {
            for (const { secret, environmentVariable } of props.secrets) {
                secret.grantRead(this._role);

                if (environmentVariable) {
                    this._environmentVariables[environmentVariable] = secret.secretName;
                }
            }
        }

        /**
         * Grant read and write permissions to s3 buckets and add to environment variales
         */
        if (props.buckets) {
            for (const { bucket, environmentVariable } of props.buckets) {
                bucket.grantReadWrite(this._role);

                if (environmentVariable) {
                    this._environmentVariables[environmentVariable] = bucket.bucketName;
                }
            }
        }

        /**
         * Grant read and write permissions to dynamoDB tables and add to environment variales
         */
        if (props.dynamoDBTables) {
            for (const { table, environmentVariable } of props.dynamoDBTables) {
                table.grantReadWriteData(this._role);

                if (environmentVariable) {
                    this._environmentVariables[environmentVariable] = table.tableName;
                }
            }
        }

        /**
         * Grant consume and send messages to SQS queues and add to environment variales
         */
        if (props.sqs) {
            for (const { queue, environmentVariable } of props.sqs) {
                queue.grantConsumeMessages(this._role);
                queue.grantSendMessages(this._role);

                if (environmentVariable) {
                    this._environmentVariables[environmentVariable] = queue.queueName;
                }
            }
        }

        /**
         * Attach managed policies
         */
        if (props.managedPolicies) {
            for (const managedPolicy of props.managedPolicies) {
                this._role.addManagedPolicy(managedPolicy);
            }
        }
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
