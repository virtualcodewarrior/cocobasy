import {serve} from './deps.ts';
import {setUpRoutes} from "./openapi-router/openapi.ts";
import {OpenApiDocument} from "./openapi-router/openapi-document.ts";
import {ensureMiddleware, MiddlewareError} from "./middle-ware/middle-ware.ts";
import {registerHandlers} from "./services/swagtest.ts";
import {registerHandlers as registerWebHandlers} from "./services/serv-web.ts";


const middleWare = ensureMiddleware();
registerHandlers(middleWare);
registerWebHandlers(middleWare);
const port = parseInt(Deno.env.get('PORT') ?? '8080', 10);
serve(middleWare.handleRequest.bind(middleWare), {port});

const openAPI: OpenApiDocument = {
    openapi: '3.0.3',
    info: {
        title: 'cocobasy',
        version: '1.0.0',
    },
    paths: {
        '/api/v1/{num}': {
            'x-swagger-router-controller': 'middleware-name1',
            get: {
                operationId: 'swagTest',
                tags: ['/test'],
                description: '',
                parameters: [],
                responses: {},
            }
        },
        '/api/v1/authentication': {
            'x-swagger-router-controller': 'middleware-name1',
            get: {
                operationId: 'swagTest',
                tags: ['/test'],
                description: '',
                parameters: [],
                responses: {},
                security: [{}],
            }
        },
        '/*': {
            'x-swagger-router-controller': 'webapp',
            get: {
                operationId: 'serveWeb',
                tags: [''],
                description: '',
                parameters: [],
                responses: {},
            }
        }
    },
    components: {
        securitySchemes: {
            basic: {
                type: 'apiKey',
                name: 'auth-key',
                in: 'cookie',
            }
        }
    }
};

setUpRoutes(middleWare, openAPI, true, (_req, _res, _authenticate) => {
    const isAuthenticated = false;
    if (!isAuthenticated) {
        throw new MiddlewareError(401, 'Unauthenticated');
    }
});
