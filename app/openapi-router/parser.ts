import {
    isRefObject,
    OpenApiDocument,
    OpenApiObject,
    PathItemObject,
    ROUTER_VERB,
    SchemaObject
} from "./openapi-document.ts";
import {ERROR_CODE, ErrorObject, MiddleWareRequest, RouteInfo, VerbInfo} from "../middle-ware/types.ts";

enum DATA_LOCATION {
    PARAMS = 'params',
    QUERY = 'query',
    HEADERS = 'headers',
    COOKIES = 'cookies',
}

const createBodyValidateObject = (required: boolean | undefined, schema: BodySchemaValidatorObject) => {
    return {
        required,
        validate(request: MiddleWareRequest) {
            const dataObject = request.body ? JSON.parse(request.body) : {};
            const errors: ErrorObject[] = [];

            if (dataObject || (!dataObject && !this.required)) {
                if (dataObject) {
                    errors.push(...schema.validate(dataObject));
                }
            } else {
                errors.push({
                    code: ERROR_CODE.REQUEST_ERROR_REQUIRED_ITEM_MISSING,
                    message: "Missing required body from request"
                });
            }
            return errors;
        }
    };
};

const retrieveRef = (ref: string, openApiDocument: OpenApiDocument) => {
    let result = null;
    if (!ref.startsWith("#")) {
        console.log(`we only support local references, so reference ${ref} cannot be handled. No schema validation will be done for this schema`);
    } else {
        const parts = ref.split("/").slice(1);
        const def = parts.reduce((previous, part) => previous[part] || {}, openApiDocument);
        if (!def) {
            console.log(`we could not find ${ref}. No schema validation will be done for this reference`);
        } else {
            result = def;
        }
    }

    return result;
};

const validateProperty = (property: string | Record<string, unknown> | unknown, propertyName: string, schema: SchemaObject, isParam: boolean): ErrorObject[] => {
    const errors = [];

    if (schema) {
        if (isParam) {
            // for params the type would always be string, only properties from objects can be properly tested for type.
            try {
                // so we convert it here to the proper type by parsing it as json
                property = typeof property === 'string' ? JSON.parse(property) : property;
            } catch (_error) {
                // do nothing
            } // in case of a parse error it will be a string
        }
        if (typeof property !== schema.type && (typeof property !== "number" || schema.type !== "integer") && (schema.type !== "array" || !Array.isArray(property))) {
            errors.push({
                code: ERROR_CODE.REQUEST_ERROR_INVALID_TYPE,
                message: `property '${propertyName}' should be of type '${schema.type}' but was of type '${Array.isArray(property) ? "array" : typeof property}'`
            });
        } else if (schema && !isRefObject(schema)) {
            switch (schema.type) {
                case 'null'.toString():
                    break;
                case 'boolean':
                    break;
                case 'object': {
                    if (property && typeof property === 'object') {
                        const numProperties = Object.keys(property).length;
                        if (schema.maxProperties !== undefined && numProperties > Math.max(0, schema.maxProperties)) {
                            errors.push({
                                code: ERROR_CODE.REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS,
                                message: `property '${propertyName}' has '${numProperties}' properties which is more than the maximum allowed number of ${schema.maxProperties}'`
                            });
                        }
                        if (schema.minProperties !== undefined && numProperties < Math.max(0, schema.minProperties)) {
                            errors.push({
                                code: ERROR_CODE.REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS,
                                message: `property '${propertyName}' has '${numProperties}' properties which is less than the minimum required number of ${schema.minProperties}'`
                            });
                        }

                        if (Array.isArray(schema.required)) {
                            schema.required.forEach((key) => {
                                if (!(key in (property as Record<string, unknown>))) {
                                    errors.push({
                                        code: ERROR_CODE.REQUEST_ERROR_REQUIRED_ITEM_MISSING,
                                        message: `property '${propertyName} is missing required property '${key}'`
                                    });
                                }
                            });
                        }

                        // if (schema.properties && !isRefObject(schema.properties)) {
                        //     Object.entries(property).forEach(([key, value]) => {
                        //         if (key in (schema.properties as SchemaObject)) {
                        //             validateProperty(value, `${propertyName}[${key}]`, schema.properties, false).forEach((p_Error) => errors.push(p_Error));
                        //         }
                        //     });
                        // }
                    } else {
                        errors.push({
                            code: ERROR_CODE.REQUEST_ERROR_INVALID_TYPE,
                            message: `property '${propertyName} is of type ${typeof property} but the required type is object`
                        });
                    }
                }
                    break;
                case 'array':
                    if (Array.isArray(property)) {
                        if (schema.maxItems !== undefined && property.length > Math.max(0, schema.maxItems)) {
                            errors.push({
                                code: ERROR_CODE.REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS,
                                message: `property '${propertyName}' has '${property.length}' items which is more than the maximum allowed number of ${schema.maxItems}'`
                            });
                        }
                        if (schema.minItems !== undefined && property.length < Math.max(0, schema.minItems)) {
                            errors.push({
                                code: ERROR_CODE.REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS,
                                message: `property '${propertyName}' has '${property.length}' items which is less than the minimal required number of ${schema.minItems}'`
                            });
                        }
                        if (schema.uniqueItems && !property.every((item, index, array) => array.indexOf(item, index + 1) === -1)) {
                            errors.push({
                                code: ERROR_CODE.REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS,
                                message: `property '${propertyName}' has duplicated items, but is required to have all unique items`
                            });
                        }

                        property.forEach((item, index) => {
                            if (schema.items && !isRefObject(schema.items)) {
                                validateProperty(item, `${propertyName}[${index}]`, schema.items, false).forEach((p_Error) => {
                                    errors.push(p_Error);
                                });
                            }
                        });
                    } else {
                        errors.push({
                            code: ERROR_CODE.REQUEST_ERROR_INVALID_TYPE,
                            message: `property '${propertyName} is of type ${typeof property} but the required type is array`
                        });
                    }
                    break;
                case 'number':
                case 'integer':
                    if (typeof property === 'number') {
                        if (schema.multipleOf !== undefined && (schema.multipleOf | 0) > 0 && (property % (schema.multipleOf | 0) !== 0)) {
                            errors.push({
                                code: ERROR_CODE.REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS,
                                message: `property '${propertyName}' with value '${property}' is not a multiple of '${(schema.multipleOf | 0)}'`
                            });
                        }
                        if (schema.maximum !== undefined && (property > schema.maximum || schema.exclusiveMaximum && property >= schema.maximum)) {
                            errors.push({
                                code: ERROR_CODE.REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS,
                                message: `property '${propertyName}' with value '${property}' is ${(schema.exclusiveMaximum && property === schema.maximum) ? "equal to" : "larger than"} the ${(schema.exclusiveMaximum) ? "exclusive" : ""} maximum of '${schema.maximum}'`
                            });
                        }
                        if (schema.minimum !== undefined && (property < schema.minimum || schema.exclusiveMinimum && property <= schema.minimum)) {
                            errors.push({
                                code: ERROR_CODE.REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS,
                                message: `property '${propertyName}' with value '${property}' is ${(schema.exclusiveMinimum && property === schema.minimum) ? "equal to" : "smaller than"} the ${(schema.exclusiveMinimum) ? "exclusive" : ""} minimum of '${schema.minimum}'`
                            });
                        }
                    } else {
                        errors.push({
                            code: ERROR_CODE.REQUEST_ERROR_INVALID_TYPE,
                            message: `property '${propertyName} is of type ${typeof property} but the required type is number`
                        });
                    }
                    break;
                case 'string':
                    if (typeof property === 'string') {
                        if (schema.format) {
                            let result = true;
                            switch (schema.format) {
                                case "email":
                                    result = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i.test(property);
                                    break;
                                case "date":
                                    result = /^\d{4}-\d{2}-\d{2}$/.test(property);
                                    break;
                                case "dateTime":
                                    result = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/i.test(property);
                                    break;
                            }
                            if (!result) {
                                errors.push({
                                    code: ERROR_CODE.REQUEST_ERROR_INVALID_FORMAT,
                                    message: `property '${propertyName}' did not match the format for '${schema.format}' when testing this value '${property}'`
                                });
                            }
                        }
                        if (schema.pattern) {
                            try {
                                const regexp = new RegExp(schema.pattern);
                                if (!regexp.test(property)) {
                                    errors.push({
                                        code: ERROR_CODE.REQUEST_ERROR_INVALID_FORMAT,
                                        message: `property '${propertyName}' did not match the pattern '${schema.pattern.toString()}' when testing this value '${property}'`
                                    });
                                }
                            } catch (p_Error) {
                                console.log(`the schema pattern was not a valid regexp: ${p_Error.message}`);
                            }
                        }
                        if (schema.minLength !== undefined && property.length < Math.max(0, schema.minLength)) {
                            errors.push({
                                code: ERROR_CODE.REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS,
                                message: `property '${propertyName}' with length ${property.length}, was shorter than the minLength of ${schema.minLength}`
                            });
                        }
                        if (schema.maxLength !== undefined && property.length > Math.max(0, schema.maxLength)) {
                            errors.push({
                                code: ERROR_CODE.REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS,
                                message: `property '${propertyName}' with length ${property.length}, was longer than the maxLength of ${schema.maxLength}`
                            });
                        }
                        if (schema.enum) {
                            if (Array.isArray(schema.enum) && schema.enum.indexOf(property) === -1) {
                                errors.push({
                                    code: ERROR_CODE.REQUEST_ERROR_OUTSIDE_OF_CONSTRAINTS,
                                    message: `property '${propertyName}' with value ${property}, was not found within the allowed values of '${schema.enum.join("','")}'`
                                });
                            } else {
                                console.log("the enum in this schema was not an array");
                            }
                        }
                    } else {
                        errors.push({
                            code: ERROR_CODE.REQUEST_ERROR_INVALID_TYPE,
                            message: `property '${propertyName} is of type ${typeof property} but the required type is string`
                        });
                    }
                    break;
                default:
                    console.log(`Invalid type: ${schema.type} in schema`);
            }
        }
    }
    return errors;
};

interface ParamSchemaValidatorObject {
    name: string;
    schema: SchemaObject;
    validate: (param: string) => ErrorObject[];
}

const createParamSchemaValidator = (name: string, schema: SchemaObject): ParamSchemaValidatorObject => {
    return {
        name,
        schema,
        validate(param) {
            return validateProperty(param, this.name, this.schema, true);
        },
    };
};

interface BodySchemaValidatorObject {
    schema: SchemaObject;
    validate: (obj: Record<string, unknown>) => ErrorObject[];
}

const createBodySchemaValidator = (schema: SchemaObject) => {
    return (schema) ? {
        schema,
        validate(obj: Record<string, unknown>) {
            const errors: ErrorObject[] = [];

            if (this.schema.properties && !isRefObject(this.schema.properties)) {
                Object.entries(this.schema.properties).forEach(([key, propSchema]) => {
                    if ((propSchema.required || (this.schema.required && this.schema.required.indexOf(key) !== -1)) && !(key in obj)) {
                        errors.push({
                            code: ERROR_CODE.REQUEST_ERROR_REQUIRED_ITEM_MISSING,
                            message: `Missing required parameter: '${key}'`
                        });
                    }
                    if (key in obj) {
                        errors.push(...validateProperty(obj[key], key, propSchema, false));
                    }
                });
            } else {
                validateProperty(obj, "body", this.schema, false);
            }
            return errors;
        }
    } : undefined;
};

interface ValidateObject {
    required?: boolean;
    name?: string;
    validate: (request: MiddleWareRequest) => ErrorObject[];
}

const createValidateObject = (required: boolean | undefined, dataLocation: DATA_LOCATION, name: string, schema: ParamSchemaValidatorObject) => ({
        required,
        name,
        validate(request: MiddleWareRequest) {
            const dataObject = undefined; //await request[dataLocation];
            let errors: ErrorObject[] = [];
            if ((dataObject && dataObject[this.name] !== undefined) || !this.required) {
                if (dataObject && dataObject[this.name] !== undefined) {
                    errors = schema.validate(dataObject[this.name]);
                }
            } else {
                errors.push({
                    code: ERROR_CODE.REQUEST_ERROR_REQUIRED_ITEM_MISSING,
                    message: `Missing required parameter: '${this.name}'`
                });
            }

            return errors;
        },
    }
);

const resolveRefsForArray = (openApiDoc: OpenApiDocument, array: OpenApiObject[]) => {
    array.forEach((item) => {
        if (typeof item === "object") {
            if (Array.isArray(item)) {
                resolveRefsForArray(openApiDoc, item);
            } else {
                resolveRefsForObject(openApiDoc, item);
            }
        }
    });
};

const resolveRefsForObject = (openApiDoc: OpenApiDocument, obj: OpenApiObject | OpenApiDocument) => {
    Object.entries(obj).forEach(([key, property]) => {
        if (property && typeof property === "object") {
            if (isRefObject(property)) {
                Object.defineProperty(obj, key, {
                    get() {
                        return retrieveRef(property.$ref, openApiDoc);
                    }
                });
            } else if (Array.isArray(property)) {
                resolveRefsForArray(openApiDoc, property);
            } else {
                resolveRefsForObject(openApiDoc, property);
            }
        }
    });
};

function resolveRefs(openApiDoc: OpenApiDocument) {
    resolveRefsForObject(openApiDoc, openApiDoc);
}

const createValidator = (route: RouteInfo, openApiDoc: OpenApiDocument) => {
    const validators: ValidateObject[] = [];
    resolveRefs(openApiDoc);
    route.validator = async (validate, req, res) => {
        const doValidate = (request: MiddleWareRequest) => validators.reduce((previous, validator) => previous.concat(validator.validate(request)), [] as ErrorObject[]);
        res.locals = res.locals ?? {validateErrors: []};
        res.locals.validateErrors = doValidate(req);
        if (res.locals.validateErrors.length) {
            if (typeof validate === "function") {
                // call fail handler function
                try {
                    await validate(req, res);
                } catch (err) {
                    throw new Error(err.message);
                }
            } else {
                // automatically send back fail
                throw new Error(res.locals.validateErrors.join('\n'));
            }
        }
    };
    // check if authentication is required, we will just check to see if a security section exists for this route and that it has at least one item
    route.mustAuthenticate = Boolean(route.operationObject.security && route.operationObject.security.length);
    // create validators for parameters
    if (route.operationObject.parameters) {
        route.operationObject.parameters.map((parameter) => {
            if (!isRefObject(parameter) && parameter.schema && !isRefObject(parameter.schema) && parameter.name && parameter.in) {
                if (parameter.allowEmptyValue && parameter.in !== "query") {
                    console.log("Parameter 'allowEmptyValue' is set to true, but the 'in' parameter is not 'query'. This is invalid according to the specifications, so we will ignore 'allowEmptyValue'");
                }
                const schema = createParamSchemaValidator(parameter.name, parameter.schema);

                switch (parameter.in) {
                    case "path":
                        if (!parameter.required) {
                            console.log("Parameter 'in' is set to 'path' but 'required' is missing or set to false. This is invalid according to the specifications, so we will assume required === true");
                        }
                        validators.push(createValidateObject(true, DATA_LOCATION.PARAMS, parameter.name, schema));
                        break;
                    case "query":
                        validators.push(createValidateObject(parameter.required, DATA_LOCATION.QUERY, parameter.name, schema));
                        break;
                    case "header":
                        validators.push(createValidateObject(parameter.required, DATA_LOCATION.HEADERS, parameter.name, schema));
                        break;
                    case "cookie":
                        validators.push(createValidateObject(parameter.required, DATA_LOCATION.COOKIES, parameter.name, schema));
                        break;
                    default:
                        console.log(`Cannot create validator for parameter: ${JSON.stringify(parameter)} because the 'in' value is not one of 'query', 'path', 'header' or 'cookie'`);
                        break;
                }
            } else {
                console.log(`Cannot create validator for parameter: ${JSON.stringify(parameter)} because it is missing one of the required parameters 'in' or 'name'`);
            }
        });
    }

    // create validators for request body
    if (route.operationObject.requestBody && !isRefObject(route.operationObject.requestBody)) {
        const required = route.operationObject.requestBody.required;
        const content = route.operationObject.requestBody.content;
        const propSchema = (content[Object.keys(content)[0] || ""] || {})?.schema;
        if (content && propSchema && !isRefObject(propSchema)) {
            const schema = createBodySchemaValidator(propSchema);
            if (schema) {
                validators.push(createBodyValidateObject(required, schema));
            } else {
                console.log(`request body: ${JSON.stringify(route.operationObject.requestBody)} had no schema or it is invalid, no validator will be created for the request body`);
            }
        } else {
            console.log(`request body: ${JSON.stringify(route.operationObject.requestBody)} had no content, no validator will be created for the request body`);
        }
    }
};

const isRouterVerb = (testVerb: string): testVerb is ROUTER_VERB => testVerb in ROUTER_VERB;

function parseVerbs(pathItemObject: PathItemObject): VerbInfo[] {
    return Object.keys(pathItemObject).map((verb) => (isRouterVerb(verb)) ? ({
        verb,
        controller: pathItemObject['x-swagger-router-controller'],
        middlewareFunction: pathItemObject[verb]?.operationId,
        operationObject: pathItemObject[verb],
    }) : undefined).filter((verbInfo): verbInfo is VerbInfo => Boolean(verbInfo));
}

function parsePaths(acc: RouteInfo[], path: [string, PathItemObject]): RouteInfo[] {
    const routes = parseVerbs(path[1]);
    const routesWithPath = routes.map((route) => ({...route, ...{path: path[0]}}));
    return [...acc, ...routesWithPath];
}

export const parser = (openApiDoc: OpenApiDocument, validate: boolean): RouteInfo[] => {
    const routes = Object.entries(openApiDoc.paths).reduce(parsePaths, []);

    if (validate) {
        routes.forEach((route) => createValidator(route, openApiDoc));
    }

    return routes;
};
