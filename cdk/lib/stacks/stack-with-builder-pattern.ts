import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as secret from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import { DocumentIngestor, PythonLambdaFunction } from '../constructs';
import { Environment } from '../types';

export interface PipelinesStackProps extends cdk.StackProps {
    environment: Environment;
}

export class PipelinesStack extends cdk.Stack {
    protected readonly id: string;
    protected readonly env: Environment;

    constructor(scope: cdk.App, id: string, props: PipelinesStackProps) {
        super(scope, id);

        this.env = props.environment;
        this.id = id;

        /**
         * Secrets
         */
        const dbSecret = secret.Secret.fromSecretNameV2(this, 'DatabaseSecret', 'dev/knowledge_base/newo4j-aura');

        /**
         * Lambda Layers
         */
        const neo4jLambdaLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'Neo4jLambdaLayer', 'arn:aws:lambda:us-east-1:905418263649:layer:neo4j:1');
        const unidecodeLambdaLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'UnidecodeLambdaLayer', 'arn:aws:lambda:us-east-1:905418263649:layer:unidecode:1');

        /**
         * Lambdas
         */
        const generateNodesDefinitionLambda = new PythonLambdaFunction(this, `GenerateNodesDefinition${id}`, {
            name: 'generate-nodes-definition',
            environment: props.environment,
        })
        .withLogGroup()
        .build();

        const prepareDatabaseLambda = new PythonLambdaFunction(this, `PrepareDatabase${id}`, {
            name: 'prepare-database',
            environment: props.environment,
        })
        .withLogGroup()
        .withDuration(90)
        .withSecret(dbSecret, 'AURA_DB_SECRET_NAME')
        .withLayers([
            neo4jLambdaLayer,
            unidecodeLambdaLayer,
        ])
        .build();

        const buildContentGraphLambda = new PythonLambdaFunction(this, `BuildContentGraph${id}`, {
            name: 'build-content-graph',
            environment: props.environment,
        })
        .withLogGroup()
        .withDuration(90)
        .withSecret(dbSecret, 'AURA_DB_SECRET_NAME')
        .withLayers([
            neo4jLambdaLayer,
        ])
        .build();

        const generateNodeEmbeddingLambda = new PythonLambdaFunction(this, `GenerateNodeEmbedding${id}`, {
            name: 'generate-node-embedding',
            environment: props.environment,
        })
        .withLogGroup()
        .withDuration(30)
        .withManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonBedrockFullAccess'),
        )
        .withLayers([
            neo4jLambdaLayer,
        ])
        .build();

        const searchNodeRelationshipsLambda = new PythonLambdaFunction(this, `SearchNodeRelationships${id}`, {
            name: 'search-node-relationships',
            environment: props.environment,
        })
        .withLogGroup()
        .withDuration(90)
        .withSecret(dbSecret, 'AURA_DB_SECRET_NAME')
        .withManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName('NeptuneFullAccess'),
        )
        .withManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        )
        .withLayers([
            neo4jLambdaLayer,
            unidecodeLambdaLayer,
        ])
        .build();

        const callbackLambda = new PythonLambdaFunction(this, `Callback${id}`, {
            name: 'callback',
            environment: props.environment,
        })
        .withLogGroup()
        .withDuration(30)
        .build();

        /**
         * State Machine
         */
        new DocumentIngestor(this, `DocumentIngestor${id}`, {
            environment: props.environment,
            name: 'DocumentIngestor',
            lambdas: {
                generateNodesDefinition: generateNodesDefinitionLambda,
                prepareDatabase: prepareDatabaseLambda,
                generateEmbeddings: generateNodeEmbeddingLambda,
                createNodes: searchNodeRelationshipsLambda,
                buildContentGraph: buildContentGraphLambda,
                callback: callbackLambda,
            },
        })
        .build();
    }
}
