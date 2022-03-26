import { WebComponentBaseClass } from '/shared/web-component-base-class/src/web-component-base-class.js';

class CocobasyApp extends WebComponentBaseClass {
	constructor() {
		super();
	}

	static get template() {
		return `
		Welcome
		`;
	}
}

window.customElements.define('cocobasy-app', CocobasyApp);
