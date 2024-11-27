import * as cdk from 'aws-cdk-lib';
import { FoundationModelIdentifier } from 'aws-cdk-lib/aws-bedrock';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { Environment } from '../../../types';

export class LambdaConstruct extends Construct {
    lambda: lambda.IFunction;
    environment: Environment;
    logGroup: logs.LogGroup;
    role: iam.Role;

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
