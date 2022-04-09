import {resolve} from '../deps.ts';
import {MiddleWare, MiddlewareError} from '../middle-ware/middle-ware.ts';
import {MiddleWareRequest, MiddleWareResponse} from '../middle-ware/types.ts';

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
};

function getMimeType(filename: string): MimeType {
	return MIME_TYPES[filename.split('.').pop() ?? ''];
}

const allowedShared = [
	'web-component-base-class',
];

const resolvedRootPath = resolve('./app/webapp');
const resolvedSharedRootPath = resolve('./app/webapp/../../node_modules');

export function registerHandlers(middleware: MiddleWare) {
	middleware.registerHandler('webapp', 'serveWeb', async (req: MiddleWareRequest, res: MiddleWareResponse) => {
		let path = req.urlObj.pathname.split('/').filter((part) => part).join('/');

		if (!path) {
			path = 'index.html';
		}
		res.status = 200;
		const resolvedPath = resolve(`./app/webapp/${path}`);
		if (resolvedPath.search(resolvedRootPath) === 0) {
			try {
				res.body = await Deno.readTextFile(resolvedPath);
			} catch (err) {
				throw new MiddlewareError(404, 'File not found');
			}
		} else {
			throw new MiddlewareError(404, 'File not found');
		}
		res.headers.append('Content-type', getMimeType(path.split('/').pop() ?? '') ?? 'text/plain');
	});
	middleware.registerHandler('webapp', 'serveShared', async (req: MiddleWareRequest, res: MiddleWareResponse) => {
		const pathParts = req.params?.path.split('/').filter((part) => part) ?? [];

		if (!allowedShared || pathParts[0] && allowedShared.includes(pathParts[0])) {
			res.status = 200;
			const resolvedPath = resolve(`${resolvedSharedRootPath}/${pathParts.join('/')}`);
			if (resolvedPath.search(resolvedSharedRootPath) === 0) {
				try {
					res.body = await Deno.readTextFile(resolvedPath);
				} catch (err) {
					throw new MiddlewareError(404, 'File not found');
				}
			} else {
				throw new MiddlewareError(404, 'File not found');
			}
			res.headers.append('Content-type', getMimeType(resolvedPath.split('/').pop() ?? '') ?? 'text/plain');
		} else {
			throw new MiddlewareError(404, 'File not found');
		}
	});
}
