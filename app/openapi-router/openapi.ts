import {parser} from "./parser.ts";
import {OpenApiDocument} from "./openapi-document.ts";
import {MiddleWare} from "../middle-ware/middle-ware.ts";
import {
    MiddlewareAuthenticationFunction,
    MiddleWareRequest,
    MiddleWareResponse,
    RouteInfo
} from "../middle-ware/types.ts";

const attachToRouter = (middleware: MiddleWare, route: RouteInfo, validate: boolean, authenticate?: MiddlewareAuthenticationFunction) => {
    const resource = route.path;
    const handler = route.controller && route.middlewareFunction ? middleware.getHandler(route.controller, route.middlewareFunction) : undefined;
    if (handler) {
        const handlers = [handler];
        // authenticate if so required
        if (authenticate && typeof authenticate === "function") {
            handlers.unshift((req, res) => {
                if (route.authenticate) {
                    authenticate(req, res, route.authenticate);
                }
            });
        }
        // validate first in case authentication depends on your request input
        if (validate) {
            handlers.unshift(async (req: MiddleWareRequest, res: MiddleWareResponse) => {
                await route.validator?.(validate, req, res);
            });
        }
        middleware.setRoute(route.verb, resource, handlers);
    } else {
        console.log(`ERROR setting up ${resource} ${route.verb}: ${route.controller}.${route.middlewareFunction} not found`);
    }
};

export function setUpRoutes(middleware: MiddleWare, openApiDoc: OpenApiDocument, validate: boolean, authenticate?: MiddlewareAuthenticationFunction) {
    parser(openApiDoc, validate).forEach((route) => {
        ((!/\\/.test(route.path)) ? attachToRouter(middleware, route, validate, authenticate) : console.log("SWAGGER doc contains invalid routes, no routes have been set-up"));
    });
    middleware.logRoutes();
}
