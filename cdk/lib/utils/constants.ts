import { STATUS_CODES } from 'node:http';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

export const SRC_BASEPATH = '../../../src';
export const LAMBDA_BASEPATH = `${SRC_BASEPATH}/lambda`;
export const HTTP = {
    METHOD: {
        GET: 'GET',
        POST: 'POST',
        PUT: 'PUT',
        PATCH: 'PATCH',
        DELETE: 'DELETE',
        HEAD: 'HEAD',
        OPTIONS: 'OPTIONS',
        CONNECT: 'CONNECT',
        TRACE: 'TRACE',
    },
    STATUS_CODE: Object.entries(STATUS_CODES).map(([code, message]) => ({ code: parseInt(code), message })),
} as const;

export const PYTHON_RUNTIME = {
    PYTHON_3_13: Runtime.PYTHON_3_13,
    PYTHON_3_12: Runtime.PYTHON_3_12,
    PYTHON_3_11: Runtime.PYTHON_3_11,
    PYTHON_3_10: Runtime.PYTHON_3_10,
    PYTHON_3_9: Runtime.PYTHON_3_9,
    PYTHON_3_8: Runtime.PYTHON_3_8,
}

export const NODEJS_RUNTIME = {
    NODEJS_LATEST: Runtime.NODEJS_LATEST,
    NODEJS_20_X: Runtime.NODEJS_20_X,
    NODEJS_18_X: Runtime.NODEJS_18_X,
};
