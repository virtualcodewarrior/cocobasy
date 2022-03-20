import {serve} from './deps.ts';
import {setUpRoutes} from "./openapi-router/openapi.ts";
import {OpenApiDocument} from "./openapi-router/openapi-document.ts";
import {ensureMiddleware} from "./middle-ware/middle-ware.ts";
import {registerHandlers} from "./services/swagtest.ts";


const middleWare = ensureMiddleware();
registerHandlers(middleWare);
const port = parseInt(Deno.env.get('PORT') ?? '8080', 10);
serve(middleWare.handleRequest.bind(middleWare), {port});

const openAPI: OpenApiDocument = {
    openapi: '3.0.3',
    info: {
        title: 'cocobasy',
        version: '1.0.0',
    },
    paths: {
        '/test/{num}': {
            'x-swagger-router-controller': 'middleware-name1',
            get: {
                operationId: 'swagTest',
                tags: ['/test'],
                description: '',
                parameters: [],
                responses: {},
            }
        },
        '/test/authentication': {
            'x-swagger-router-controller': 'middleware-name1',
            get: {
                operationId: 'swagTest',
                tags: ['/test'],
                description: '',
                parameters: [],
                responses: {},
                security: [{}],
            }
        }
    }
};

setUpRoutes(middleWare, openAPI, true, (_req, _res) => {
    const isAuthenticated = true;
    if (!isAuthenticated) {
        throw Error('Unauthenticated');
    }
});
