import json
import logging
import boto3
import botocore

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Lambda function to log the event and context.
    
    :param event: The event data passed to the Lambda function.
    :param context: The context object containing information about the invocation.
    :return: A success message.
    """
    # Log the event
    logger.info("Event received: %s", json.dumps(event, indent=2))
    
    # Log boto3 and botocore versions
    print(f'boto3 version: {boto3.__version__}')
    print(f'botocore version: {botocore.__version__}')

    # Log the context (as a dictionary for readability)
    context_info = {
        "aws_request_id": context.aws_request_id,
        "log_group_name": context.log_group_name,
        "log_stream_name": context.log_stream_name,
        "function_name": context.function_name,
        "memory_limit_in_mb": context.memory_limit_in_mb,
        "function_version": context.function_version,
        "invoked_function_arn": context.invoked_function_arn,
    }
    logger.info("Context information: %s", json.dumps(context_info, indent=2))
    
    return {
        "statusCode": 200,
        "body": json.dumps({"message": "Event and context logged successfully!"})
    }