import { h, Menu } from '../Util.js';
export default class Toolbar {
    constructor(app, element) {
        this.app = app;
        this.element = element;
        this.menu = null;
        this.element.innerHTML = '';
    }
    setMenu(menu) {
        this.menu = menu;
        const menuWrapper = h('div', { id: 'toolbar' }, menu.map((item, i) => h('div', { class: 'toolbar-item' }, item.label, e => {
            e.stopPropagation();
            this.showMenu(i);
        })));
        this.element.replaceWith(menuWrapper);
        this.element = menuWrapper;
    }
    showMenu(i) {
        if (!this.menu[i].submenu)
            return;
        new Menu(this.menu[i].submenu).show(this.element.children[i].offsetLeft, 16);
    }
}
//# sourceMappingURL=Toolbar.js.map