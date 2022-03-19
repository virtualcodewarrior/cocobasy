import {parser} from "./parser.ts";
import {OpenApiDocument} from "./openapi-document.ts";
import {MiddleWare} from "../middle-ware/middle-ware.ts";
import {MiddlewareFunction, MiddleWareRequest, MiddleWareResponse, RouteInfo} from "../middle-ware/types.ts";

const attachToRouter = (middleware: MiddleWare, route: RouteInfo, validate: boolean, authenticate?: MiddlewareFunction) => {
    const resource = route.path;
    const handler = route.controller && route.middlewareFunction ? middleware.getHandler(route.controller, route.middlewareFunction) : undefined;
    if (handler) {
        console.log(`SETTING UP ROUTE ${resource} ${route.verb} ${route.controller}.${route.middlewareFunction}`);
        const handlers = [handler];
        // authenticate if so required
        if (authenticate && typeof authenticate === "function" && route.mustAuthenticate) {
            handlers.unshift(authenticate);
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

export function setUpRoutes(middleware: MiddleWare, openApiDoc: OpenApiDocument, validate: boolean, authenticate?: MiddlewareFunction) {
    parser(openApiDoc, validate).forEach((route) => {
        ((!/\\/.test(route.path)) ? attachToRouter(middleware, route, validate, authenticate) : console.log("SWAGGER doc contains invalid routes, no routes have been set-up"));
    });
}
