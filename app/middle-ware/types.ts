import {OperationObject, ROUTER_VERB} from "../openapi-router/openapi-document.ts";

export enum ERROR_CODE {
    REQUEST_ERROR_REQUIRED_ITEM_MISSING = 'REQUEST_ERROR_REQUIRED_ITEM_MISSING',
    REQUEST_ERROR_INVALID_TYPE = 'REQUEST_ERROR_INVALID_TYPE',
    REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS = 'REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS',
    REQUEST_ERROR_INVALID_FORMAT = 'REQUEST_ERROR_INVALID_FORMAT',
}

export interface VerbInfo {
    verb: ROUTER_VERB;
    controller: string;
    middlewareFunction: string;
    operationObject: OperationObject;
}

export interface RouteInfo extends VerbInfo {
    path: string;
    validator?: (validate: boolean | MiddlewareFunction, req: MiddleWareRequest, res: MiddleWareResponse) => Promise<void>;
    mustAuthenticate?: boolean;
}

export interface ErrorObject {
    code: ERROR_CODE;
    message: string;
}

export interface MiddleWareResponse {
    status?: number;
    locals?: {
        validateErrors: ErrorObject[];
    };
    body?: Blob | BufferSource | FormData | ReadableStream | URLSearchParams | string;
}

export interface MiddleWareRequest {
    originalRequest: Request;
    url: string;
    urlObj: URL;
    method: ROUTER_VERB;
    body?: string;
    params?: Record<string, string>;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
    query?: Record<string, string>;
}

export type MiddlewareFunction = (req: MiddleWareRequest, res: MiddleWareResponse) => Promise<void> | void;
