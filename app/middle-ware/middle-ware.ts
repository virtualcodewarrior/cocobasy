import {ROUTER_VERB} from "../openapi-router/openapi-document.ts";
import {MiddlewareFunction, MiddleWareRequest, MiddleWareResponse} from "./types.ts";
import {getCookies} from "https://deno.land/std/http/cookie.ts";
import {compareUrlPattern} from "../utils/compare-url-pattern.ts";

interface Route {
    handlers: MiddlewareFunction[];
    urlPattern: URLPattern;
}

export class MiddlewareError extends Error {
    private _status: number;

    constructor(status: number, error: string) {
        super(error)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MiddlewareError)
        }

        this.name = 'MiddlewareError';
        this._status = status;
    }

    get status() {
        return this._status
    }
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
        const pathname = parts.map((part) => /^{[^}]+}$/.test(part) ? `:${part.slice(1, -1)}` : part).join('/');
        this.routes[verb] = this.routes[verb] ?? [];
        this.routes[verb].push({
            handlers,
            urlPattern: new URLPattern({pathname}),
        });
        this.routes[verb].sort((first, second) => compareUrlPattern(first.urlPattern, second.urlPattern));
    }

    async handleRequest(req: Request): Promise<Response> {
        const middleWareResponse: MiddleWareResponse = {headers: new Headers()};
        const verb = methodToRouterVerb(req.method);
        let response;
        if (verb) {
            const urlObj = new URL(req.url);
            const headers = Array.from(req.headers.entries()).reduce((prev, [key, value]) => {
                prev[key] = value;
                return prev
            }, {} as Record<string, string>);
            const query = Array.from(urlObj.searchParams.entries()).reduce((prev, [key, value]) => {
                prev[key] = value;
                return prev
            }, {} as Record<string, string>);
            const middleWareRequest: MiddleWareRequest = {
                originalRequest: req,
                url: req.url,
                urlObj,
                method: verb,
                query,
                headers,
                cookies: getCookies(req.headers),
            };
            try {
                await this.doHandle(middleWareRequest, middleWareResponse);
                response = new Response(middleWareResponse.body, {
                    status: middleWareResponse.status,
                    headers: middleWareResponse.headers,
                });
            } catch (err) {
                if (err instanceof MiddlewareError) {
                    response = new Response(`error: ${err.message}`, {status: err.status});
                } else {
                    response = new Response(`error: ${err}`, {status: 500});
                }
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

    logRoutes() {
        Object.entries(this.routes).forEach(([key, routes]) => {
            routes.forEach((route) => {
                console.log(`SETTING UP '${key.toUpperCase()}' ROUTE ${route.urlPattern.pathname}`);
            })
        });
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


