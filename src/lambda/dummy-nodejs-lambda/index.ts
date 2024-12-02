import { Logger } from '@aws-lambda-powertools/logger';
import { Context } from 'aws-lambda';

const logger = new Logger({ serviceName: 'DummyLambda', sampleRateValue: 1 });

export interface Response {
    statusCode: number;
    body: string;
}

export async function handler(event: unknown, _context: Context): Promise<Response> {
    logger.info(`Request received: ${event}`);

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Ok',
        }),
    };
}
