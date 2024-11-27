import * as cdk from 'aws-cdk-lib';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import * as rustLambda from 'cargo-lambda-cdk';
import { Construct } from 'constructs';
import * as nodePath from 'node:path';
import { LambdaConstruct } from '.';
import type { Environment } from '../../../types';
import * as utils from '../../../utils';
import path = require('node:path');

type LambdaDatabaseProps = {
    database?: {
        vpc: ec2.IVpc;
        securityGroup: ec2.ISecurityGroup;
        secret: ISecret;
    };
};

export type RustLambdaProps = {
    name: string;
    path: string;
    basePath?: string;
    duration?: cdk.Duration;
    memorySize?: number;
    environmentVariables?: {
        [key: string]: string;
    };
    concurrency?: number;
    layers?: lambda.ILayerVersion[];
    bundling?: rustLambda.BundlingOptions;
    policies?: iam.PolicyStatementProps[],
    environment: Environment;
    secrets?: Record<string, ISecret>;
    bedrockModelsIdentifiers?: bedrock.FoundationModelIdentifier[];
} & LambdaDatabaseProps;

export class RustFunctionConstruct extends LambdaConstruct {
    function: rustLambda.RustFunction;

    constructor(scope: Construct, id: string, props: RustLambdaProps) {
        super(scope, id);

        const environment = this.environment = props.environment;
        const functionName = utils.getPrefixed(props.name, environment);
        const manifestPath = nodePath.join(__dirname, `${props.basePath ?? utils.constants.LAMBDA_BASEPATH}/${props.path}/Cargo.toml`);

        /**
         * CloudWatch
         */
        const logGroup = this.logGroup = new logs.LogGroup(this, `LogGroup${id}`, {
            logGroupName: `/aws/lambda/${functionName}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            retention: logs.RetentionDays.ONE_WEEK,
        });

        /**
         * IAM - Permissions
         */
        const role = this.role = new iam.Role(this, `Role${id}`, {
            assumedBy: new iam.CompositePrincipal(
                new iam.ServicePrincipal('lambda.amazonaws.com')
            ),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName(`service-role/AWSLambdaVPCAccessExecutionRole`),
            ]
        });

        const defaultPolicyStatement = this.createDefaultLambdaPolicyStatementProps();
        // const databaseClusterPolicies = this.createDatabaseClusterPolicyStatementsProps(role.roleId, props.rdsDatabase);
        const bedrockModelsPolicies = this.createBedrockFoundationModelPolicyStatementProps(props.bedrockModelsIdentifiers);

        const policyStatements = defaultPolicyStatement.concat(
            props.policies ?? [],
            // dynamoDBTablePolicies,
            // databaseClusterPolicies,
            bedrockModelsPolicies,
        );

        role.attachInlinePolicy(
            new iam.Policy(this, `Policy${id}`, {
                statements: policyStatements.map(
                    ({ effect, resources, actions }) =>
                        new iam.PolicyStatement({
                            effect,
                            resources,
                            actions
                        })
                )
            })
        );

        /**
         * Environment Variables
         */
        const environmentVariables = {
            ...props.environmentVariables,
        };

        // Grant read access to secrets
        if (props.secrets) {
            for (const secretKey in props.secrets) {
                // Properties are like environment variables but for Custom Resources
                environmentVariables[secretKey] = props.secrets[secretKey].secretName;

                // Grant read access to the secret
                props.secrets[secretKey].grantRead(role);
            }
        }

        // Attach RDS Database vpc and select private subnet if defined in props
        const rdsClusterVpcSettings = props.rdsDatabase
            ? {
                vpc: props.rdsDatabase.vpc,
                vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
                securityGroups: [props.rdsDatabase.securityGroup],
            }
            : undefined;

        // Attach EC2 Database settings
        const databaseVpcSettings = props.database
            ? {
                vpc: props.database.vpc,
                vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
                securityGroups: [props.database.securityGroup],
            }
            : undefined;

        const vpcSettings = rdsClusterVpcSettings ?? databaseVpcSettings;

        /**
         * Lamba Function
         */
        this.lambda = new rustLambda.RustFunction(this, 'RustFunction', {
            functionName,
            manifestPath,
            timeout: props.duration,
            environment: environmentVariables,
            memorySize: props.memorySize,
            reservedConcurrentExecutions: props.concurrency,
            architecture: lambda.Architecture.ARM_64,
            layers: props.layers,
            bundling: {
                ...props.bundling
            },
            logGroup,
            role,
            vpc: vpcSettings?.vpc,
            vpcSubnets: vpcSettings?.vpcSubnets,
            securityGroups: vpcSettings?.securityGroups,
        });
    }
}
