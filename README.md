# AWS CDK Constructs with Builder Pattern vs Normal Constructors

![Cartoon Building](./docs/assets/cartoon-building.png)

The [AWS Cloud Development Kit (CDK)](https://docs.aws.amazon.com/cdk/v2/guide/home.html) is an open-source software development framework that allows developers to define cloud infrastructure using programming languages.

This repository explores an alternative approach using what is known in Software Development as [The Builder Pattern](https://en.wikipedia.org/wiki/Builder_pattern), providing practical examples for both approaches.

The Builder Pattern aims to separate the process of constructing a complex object from its representation, allowing the same construction process to produce different representations.

This is not intended to demerit one over the other, that's left for the lecturer to judge by themselves.

## Understanding AWS CDK Constructs

[AWS CDK Constructs](https://docs.aws.amazon.com/cdk/v2/guide/constructs.html) are fundamental components that allow you to create and configure AWS resources in a programmatically controlled manner. Understanding how these constructs work is essential for effective cloud infrastructure management.

### The Basics of AWS CDK Constructs

At its core, a construct is initialized by initializing what is known in object oriented programming as a constructor. In the context of AWS CDK, constructs are responsible for setting up resources like Amazon S3 buckets, Amazon DynamoDB tables, and other AWS services directly within your application code. They encapsulate the configuration capabilities of these services, enabling developers to define the entire resource stack through code.

### Key Features of AWS CDK Constructs

Several key features characterize AWS CDK Constructs, enhancing their functionality and usability:

1. Strong Typing: Since AWS CDK is built on popular programming languages, it offers strong typing, which helps catch errors at compile time rather than at runtime.
2. Modularity: Constructs promote modularity in your code, allowing you to create reusable components that make managing your infrastructure easier.
3. Rich Constructs Library: AWS CDK provides a rich library of pre-built constructs, significantly speeding up the development process by reducing the amount of boilerplate code required.

These features contribute to a streamlined development experience, enabling developers to focus on creating robust and efficient cloud solutions. Additionally, the AWS CDK supports various programming languages, including TypeScript, JavaScript, Python, Java, Go, and .NET, which broadens its accessibility and allows teams to leverage their existing skill sets.

When you synthesize your CDK app, it generates CloudFormation templates that can be deployed directly to AWS.

This not only ensures consistency across environments but also provides the benefits of CloudFormation's extensive features, such as change sets and rollback capabilities, enhancing the overall reliability of your infrastructure management process.

### Code Example

You can find an example of multiple lambda functions built using normal constructors at [cdk/lib/stacks/stack-with-allin-constructor.ts](./cdk/lib/stacks/stack-with-allin-constructor.ts)

#### Example:
```ts
    import * as cdk from 'aws-cdk-lib';
    import * as iam from 'aws-cdk-lib/aws-iam';
    import * as lambda from 'aws-cdk-lib/aws-lambda';
    import * as secret from 'aws-cdk-lib/aws-secretsmanager';
    import { PythonFunctionConstruct } from '../constructs/lambda/constructors';
    import { Environment } from '../types';

    declare const mySecret: secret.ISecret;
    declare const myLambdaLayer: lambda.LayerVersion;
    declare const environment: Environment;

    const simplePythonLambda = new PythonFunctionConstruct(this, 'SimpleConstructorPythonLambda', {
        name: 'dummy-constructor-python-lambda',
        environment,
        path: 'dummy-python-lambda',
    });

    const complexPythonLambda = new PythonFunctionConstruct(this, 'ComplexConstructorPythonLambda', {
        name: 'complex-constructor-python-lambda',
        environment,
        withLogGroup: true,
        path: 'dummy-python-lambda',
        secrets: [{
            secret: mySecret, environmentVariable: 'SECRET_NAME' 
        }],
        layers: [
            myLambdaLayer
        ],
        duration: cdk.Duration.seconds(90),
        managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonBedrockFullAccess'),
            iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        ],
    });
```

## Delving into Builder Pattern

The Builder Pattern is a design pattern that provides a systematic way of constructing complex objects step by step. It is commonly employed in scenarios where an object requires several configuration options that can be varied independently.

### Defining the Builder Pattern

In the context of AWS CDK, the Builder Pattern allows you to construct resources by chaining method calls, making the code easier to read and maintain. Instead of having multiple constructor parameters, the builder pattern abstracts this complexity, offering a fluent interface.

For instance, creating an Amazon S3 bucket can be executed through a series of method calls that are clearer than using a single constructor with multiple arguments.

Moreover, the Builder Pattern not only simplifies the instantiation process but also promotes a more organized code structure. By encapsulating the construction logic within a dedicated builder class, developers can separate the concerns of object creation from the business logic, leading to cleaner and more maintainable codebases.

This separation is particularly beneficial in larger projects where multiple developers are involved, as it reduces the cognitive load associated with understanding complex constructors.

### Benefits of Using Builder Pattern in AWS CDK

The Builder Pattern presents several advantages when used within AWS CDK:

1. Enhanced Readability: Code written with the Builder Pattern is often easier to read and understand, especially for those who may not be familiar with all the parameters used in a normal constructor.
2. Flexible Configuration: This pattern allows for more flexible configurations, as properties can be set in any order without affecting the outcome, catering to various use cases.
3. Default Values: Builders can inherently handle default values, meaning if a user does not specify a parameter, a sensible default will be used, which minimizes configuration errors.

Additionally, the pattern facilitates easier testing and debugging. Since the builder can be constructed in a stepwise manner, it allows developers to verify the state of the object at various stages of its construction. This incremental verification can be invaluable in identifying where issues may arise, especially in intricate configurations involving multiple AWS services.

Furthermore, the Builder Pattern encourages reusability of code components. Developers can create different builder implementations for various configurations or resource types, allowing them to reuse common logic while still providing the flexibility needed for specific use cases.

### Code Example

You can find an example of multiple lambda functions built using normal constructors at [cdk/lib/stacks/stack-with-builder-pattern.ts](./cdk/lib/stacks/stack-with-builder-pattern.ts)

#### Example:
```ts
    import * as cdk from 'aws-cdk-lib';
    import * as iam from 'aws-cdk-lib/aws-iam';
    import * as lambda from 'aws-cdk-lib/aws-lambda';
    import * as secret from 'aws-cdk-lib/aws-secretsmanager';
    import { PythonLambdaFunctionBuilder } from '../constructs';
    import { Environment } from '../types';

    declare const mySecret: secret.ISecret;
    declare const myLambdaLayer: lambda.LayerVersion;
    declare const environment: Environment;

    const simplePythonLambda = new PythonLambdaFunctionBuilder(this, 'BuilderSimplePythonLambda', {
            name: 'dummy-python-lambda',
            environment: environment,
        })
            .build();

        const complexPythonLambda = new PythonLambdaFunctionBuilder(this, 'BuilderComplexPythonLambda', {
            name: 'complex-builder-python',
            environment: environment,
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
```

## Choosing Between Builder Pattern and Normal Constructors

Deciding between Builder Pattern and normal constructors in AWS CDK shouldn't be a one-size-fits-all approach. Instead, it should depend on your specific project requirements and individual preferences.

### Factors to Consider When Choosing a Constructor
When making this decision, consider the following factors:

1. Complexity of Resources: For complex resources with several configurable options, the Builder Pattern often becomes more manageable and readable.
2. Team Familiarity: If your team is more experienced with traditional object-oriented patterns, normal constructors might be more comfortable to implement initially.
3. Maintainability: Evaluate how maintainable your code will be in the long run; the Builder Pattern may enhance maintainability for large projects.

### Making the Right Choice for Your AWS CDK Project

Ultimately, the right choice will depend on your project’s parameters and the team’s experience. For projects that include a variety of AWS resources with different configurations, the Builder Pattern is often favored. However, for smaller projects or simple configurations, normal constructors can suffice.

## Extra:

### Multiple Languages Lambda Functions

Notice I've left implementation of CDK Constructs using constructor and builder pattern for lambda functions supporting the following languages:

1. [Nodejs](https://nodejs.org) 🐢
2. [Rust](https://www.rust-lang.org) 🦀❤️
3. [Python](https://www.python.org) 🐍
4. [Go](https://go.dev) 🐿️

They're at [cdk/lib/constructs/lambda/builders](./cdk/lib/constructs/lambda/builders) and [cdk/lib/constructs/lambda/constructors](./cdk/lib/constructs/lambda/constructors) respectively.