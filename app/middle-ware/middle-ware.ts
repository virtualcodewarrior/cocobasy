import {ROUTER_VERB} from "../openapi-router/openapi-document.ts";
import {MiddlewareFunction, MiddleWareRequest, MiddleWareResponse} from "./types.ts";
import {getCookies} from "https://deno.land/std/http/cookie.ts";

interface Route {
    handlers: MiddlewareFunction[];
    urlPattern: URLPattern;
}

function methodToRouterVerb(method: string): ROUTER_VERB | undefined {
    const lowerCaseMethod = method.toLowerCase();
    return Object.values(ROUTER_VERB).find((key) => key === lowerCaseMethod);
}

export class MiddleWare {
    private preHandlers: MiddlewareFunction[];
    private postHandlers: MiddlewareFunction[];
    private middlewareObjects: Record<string, Record<string, MiddlewareFunction>>;
    private routes: Record<string, Route[]>;

    constructor() {
        this.preHandlers = [];
        this.postHandlers = [];
        this.middlewareObjects = {};
        this.routes = {};
    }

    use(handler: MiddlewareFunction) {
        if (Object.keys(this.routes).length === 0) {
            if (!this.preHandlers.includes(handler)) {
                this.preHandlers.push(handler);
            }
        } else {
            if (!this.postHandlers.includes(handler)) {
                this.postHandlers.push(handler);
            }
        }
    }

    setRoute(verb: ROUTER_VERB, resource: string, handlers: MiddlewareFunction[]) {
        const parts = resource.split('/');
        this.routes[verb] = this.routes[verb] ?? [];
        this.routes[verb].push({
            handlers,
            urlPattern: new URLPattern({pathname: parts.map((part) => /^{[^}]+}$/.test(part) ? `:${part.slice(1, -1)}` : part).join('/')}),
        });
    }

    async handleRequest(req: Request): Promise<Response> {
        const middleWareResponse: MiddleWareResponse = {};
        const verb = methodToRouterVerb(req.method);
        let response;
        if (verb) {
            const urlObj = new URL(req.url);
            const middleWareRequest: MiddleWareRequest = {
                originalRequest: req,
                url: req.url,
                urlObj,
                method: verb,
                query: urlObj.search,
                headers: req.headers,
                cookies: getCookies(req.headers),
            };
            try {
                await this.doHandle(middleWareRequest, middleWareResponse);
                response = new Response(middleWareResponse.body, {
                    status: middleWareResponse.status,
                });
            } catch (err) {
                response = new Response(`error: ${err}`, {status: 500});
            }
        } else {
            response = new Response();
        }
        return response;
    }

    registerHandler(context: string, functionName: string, handler: MiddlewareFunction) {
        this.middlewareObjects[context] = this.middlewareObjects[context] ?? {};
        this.middlewareObjects[context][functionName] = handler;
    }

    getHandler(context: string, functionName: string) {
        return this.middlewareObjects[context][functionName];
    }

    private async doHandle(req: MiddleWareRequest, res: MiddleWareResponse): Promise<void> {
        const route = this.getRoute(req.url, req.method);
        if (route) {
            req.params = route.urlPattern.exec(req.url)?.pathname.groups;
            const handlers = [...this.preHandlers, ...(route.handlers ?? []), ...this.postHandlers];
            res.status = 400;

            for (const handler of handlers) {
                await handler(req, res);
            }
        } else {
            res.status = 404;
        }
    }

    private getRoute(url: string, method: string): Route | undefined {
        const routerVerb = methodToRouterVerb(method);
        return routerVerb ? this.routes[routerVerb]?.find((route: Route) => route.urlPattern.test(url)) : undefined;
    }
}

let middleware: MiddleWare;

export function ensureMiddleware() {
    if (!middleware) {
        middleware = new MiddleWare();
    }
    return middleware;
}
