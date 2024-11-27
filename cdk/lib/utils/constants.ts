import { STATUS_CODES } from 'node:http';

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
