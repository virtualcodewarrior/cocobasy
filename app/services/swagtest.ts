import {MiddleWare} from "../middle-ware/middle-ware.ts";
import {MiddleWareRequest, MiddleWareResponse} from "../middle-ware/types.ts";

export function registerHandlers(middleware: MiddleWare) {
    middleware.registerHandler('middleware-name1', 'swagTest', (req: MiddleWareRequest, res: MiddleWareResponse) => {
        res.status = 200;
        res.body = `The parameter was ${req.params?.num ?? 'unset'}`;
    });
}
