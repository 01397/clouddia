import { h } from '../Util.js';
export default class Toolbar {
    constructor(app, element) {
        this.app = app;
        this.element = element;
        const saveButton = h('button', null, '.oudで保存(β)', this.app.save.bind(this.app));
        const content = h('div', { class: 'toolbar' }, saveButton);
        this.element.innerHTML = '';
        this.element.append(content);
    }
}
//# sourceMappingURL=Toolbar.js.map