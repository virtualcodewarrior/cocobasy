export interface ContactObject {
    name?: string;
    url?: string;
    email?: string;
}

export interface LicenseObject {
    name: string;
    url?: string;
}

export interface InfoObject {
    title: string;
    description?: string;
    termsOfService?: string;
    contact?: ContactObject;
    license?: LicenseObject;
    version: string;
}

export interface ServerVariableObject {
    enum?: string[];
    default: string;
    description?: string;
}

export interface ServerObject {
    url: string;
    description?: string;
    variables?: Record<string, ServerVariableObject>;
}

export interface OperationObject {
    tags?: string[];
    summary?: string;
    description?: string;
    externalDocs?: ExternalDocumentationObject;
    operationId?: string;
    parameters?: (ParameterObject | ReferenceObject)[];
    requestBody?: RequestBodyObject | ReferenceObject;
    responses?: ResponsesObject;
    callbacks?: Record<string, CallbackObject | ReferenceObject>;
    deprecated?: boolean;
    security?: SecurityRequirementObject[];
    servers?: ServerObject[];
}

export enum ROUTER_VERB {
    get = 'get',
    put = 'put',
    post = 'post',
    delete = 'delete',
    options = 'options',
    head = 'head',
    patch = 'patch',
    trace = 'trace',
}

export interface PathItemObject {
    $ref?: string;
    summary?: string;
    description?: string;
    [ROUTER_VERB.get]?: OperationObject;
    [ROUTER_VERB.put]?: OperationObject;
    [ROUTER_VERB.post]?: OperationObject;
    [ROUTER_VERB.delete]?: OperationObject;
    [ROUTER_VERB.options]?: OperationObject;
    [ROUTER_VERB.head]?: OperationObject;
    [ROUTER_VERB.patch]?: OperationObject;
    [ROUTER_VERB.trace]?: OperationObject;
    'x-swagger-router-controller'?: string;
    servers?: ServerObject[];
    parameters?: (ParameterObject | ReferenceObject)[];
}

export type PathsObject = Record<string, PathItemObject>;
export type Styles = 'matrix' | 'label' | 'form' | 'simple' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject';

export interface DiscriminatorObject {
    propertyName: string;
    mapping?: Record<string, string>;
}

export interface XMLObject {
    name?: string;
    namespace?: string;
    prefix?: string;
    attribute?: boolean;
    wrapped?: boolean;
}

export interface SchemaObject {
    title?: string;
    multipleOf?: number;
    maximum?: number;
    exclusiveMaximum?: number;
    minimum?: number;
    exclusiveMinimum?: number;
    maxLength?: number;
    minLength?: number;
    pattern?: RegExp;
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    maxProperties?: number;
    minProperties?: number;
    required?: string[];
    enum?: string[];
    type?: 'null' | 'boolean' | 'object' | 'array' | 'number' | 'string' | 'integer';
    allOf?: SchemaObject | ReferenceObject;
    oneOf?: SchemaObject | ReferenceObject;
    anyOf?: SchemaObject | ReferenceObject;
    not?: SchemaObject | ReferenceObject;
    items?: SchemaObject | ReferenceObject;
    properties?: SchemaObject | ReferenceObject;
    additionalProperties?: boolean | Record<string, unknown> | SchemaObject | ReferenceObject;
    description?: string;
    format?: string;
    default?: unknown;
    nullable?: boolean;
    discriminator?: DiscriminatorObject;
    readOnly?: boolean;
    writeOnly?: boolean;
    xml?: XMLObject;
    externalDocs?: ExternalDocumentationObject;
    example?: unknown;
    deprecated?: boolean;
}

export interface ReferenceObject {
    $ref: string;
}

export interface ResponseObject {
    description?: string;
    headers?: Record<string, HeaderObject | ReferenceObject>;
    content?: Record<string, MediaTypeObject>;
    links?: Record<string, LinkObject | ReferenceObject>;
}

export type ResponsesObject = Record<string, ResponseObject | ReferenceObject>;

export interface EncodingObject {
    contentType?: string;
    headers?: Record<string, HeaderObject | ReferenceObject>;
    style?: Styles;
    explode?: boolean;
    allowReserved?: boolean;
}

export interface MediaTypeObject {
    schema?: SchemaObject | ReferenceObject;
    example?: unknown;
    examples?: Record<string, ExampleObject | ReferenceObject>;
    encoding?: Record<string, EncodingObject>;
}

export interface HeaderObject {
    description?: string;
    required?: boolean;
    deprecated?: boolean;
    allowEmptyValue?: boolean;
    style?: Styles;
    explode?: boolean;
    allowReserved?: boolean;
    schema?: SchemaObject | ReferenceObject;
    example?: unknown;
    examples?: Record<string, ExampleObject | ReferenceObject>;
    content?: Record<string, MediaTypeObject>;
}


export interface ParameterObject extends HeaderObject {
    name: string;
    in: 'query' | 'header' | 'path' | 'cookie';
}

export interface ExampleObject {
    summary?: string;
    description?: string;
    value?: unknown;
    externalValue?: string;
}

export interface RequestBodyObject {
    description?: string;
    content: Record<string, MediaTypeObject>;
    required?: boolean;
}

export interface OAuthFlowObject {
    authorizationUrl: string;
    tokenUrl: string;
    refreshUrl?: string;
    scopes: Record<string, string>;
}

export interface OAuthFlowsObject {
    implicit?: OAuthFlowObject;
    password?: OAuthFlowObject;
    clientCredentials?: OAuthFlowObject;
    authorizationCode?: OAuthFlowObject;
}

export interface SecuritySchemeObject {
    type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
    description?: string;
    name: string;
    in: 'query' | 'header' | 'cookie';
    scheme?: string;
    bearerFormat?: string;
    flows?: OAuthFlowsObject;
    openIdConnectUrl?: string;
}

export interface LinkObject {
    operationRef?: string;
    operationId?: string;
    parameters?: Record<string, unknown>;
    requestBody?: unknown;
    description?: string;
    server?: ServerObject;
}

export type CallbackObject = Record<string, PathItemObject>;

export interface ComponentsObject {
    schemas?: Record<string, SchemaObject | ReferenceObject>;
    responses?: Record<string, ResponsesObject | ReferenceObject>;
    parameters?: Record<string, ParameterObject | ReferenceObject>;
    examples?: Record<string, ExampleObject | ReferenceObject>;
    requestBodies?: Record<string, RequestBodyObject | ReferenceObject>;
    headers?: Record<string, HeaderObject | ReferenceObject>;
    securitySchemes?: Record<string, SecuritySchemeObject | ReferenceObject>;
    links?: Record<string, LinkObject | ReferenceObject>;
    callbacks?: Record<string, CallbackObject | ReferenceObject>;
}

export type SecurityRequirementObject = Record<string, string[]>;

export interface TagObject {
    name?: string;
    description?: string;
    externalDocs?: ExternalDocumentationObject;
}

export interface ExternalDocumentationObject {
    url: string;
    description?: string;
}

export interface OpenApiDocument {
    [key: string]: unknown;

    openapi: string;
    info: InfoObject;
    paths: PathsObject;
    servers?: ServerObject[];
    components?: ComponentsObject;
    security?: SecurityRequirementObject[];
    tags?: TagObject[];
    externalDocs?: ExternalDocumentationObject;
}

export type OpenApiObject = ReferenceObject | HeaderObject | LinkObject | SchemaObject |
    ResponseObject | ParameterObject | ExampleObject | RequestBodyObject | SecuritySchemeObject | CallbackObject;

export const isRefObject = (obj: OpenApiObject): obj is ReferenceObject => '$ref' in obj;
