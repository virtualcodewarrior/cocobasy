import {MiddleWare} from "../middle-ware/middle-ware.ts";
import {MiddleWareRequest, MiddleWareResponse} from "../middle-ware/types.ts";

type MimeType = 'text/html'
    | 'text/javascript'
    | 'image/png'
    | 'image/jpeg'
    | 'image/webp'
    | 'image/svg+xml'
    | 'text/plain'
    | 'video/mpg'
    | 'video/webm'
    | 'application/json'
    | 'application/pdf'
    | 'font/ttf'
    | 'font/otf'
    | 'font/woff'
    | 'application/zip'
    | 'image/gif'
    | 'image/apng'
    | 'text/css'
    | 'image/avif'
    | 'audio/wav'
    | 'audio/wave'
    | 'audio/ogg'


const MIME_TYPES: Record<string, MimeType> = {
    html: 'text/html',
    js: 'text/javascript',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    txt: 'text/plain',
    mp4: 'video/mpg',
    webm: 'video/webm',
    json: 'application/json',
    pdf: 'application/pdf',
    ttf: 'font/ttf',
    otf: 'font/otf',
    woff: 'font/woff',
    zip: 'application/zip',
    gif: 'image/gif',
    apng: 'image/apng',
    css: 'text/css',
    avif: 'image/avif',
    wav: 'audio/wav',
    wave: 'audio/wave',
    ogg: 'audio/ogg',
}

function getMimeType(filename: string): MimeType {
    return MIME_TYPES[filename.split('.').pop() ?? ''];
}

export function registerHandlers(middleware: MiddleWare) {
    middleware.registerHandler('webapp', 'serveWeb', async (req: MiddleWareRequest, res: MiddleWareResponse) => {
        let path = req.urlObj.pathname.split('/').filter((part) => part).join('/');
        if (!path) {
            path = 'index.html';
        }
        res.status = 200;
        res.body = await Deno.readTextFile(`./app/webapp/${path}`);
        res.headers.append('Content-type', getMimeType(path.split('/').pop() ?? '') ?? 'text/plain');
    });
}
