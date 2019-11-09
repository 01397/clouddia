import { h, Menu } from '../Util.js';
export default class Toolbar {
    constructor(app, element) {
        this.app = app;
        this.element = element;
        this.menuItems = null;
        this.element.innerHTML = '';
    }
    setMenu(menuItems) {
        this.menuItems = menuItems;
        const menuWrapper = h('div', { id: 'toolbar' }, menuItems.map((item, i) => h('div', { class: 'toolbar-item' }, item.label, e => {
            e.stopPropagation();
            this.showMenu(i);
        })));
        this.element.replaceWith(menuWrapper);
        this.element = menuWrapper;
    }
    showMenu(i) {
        if (this.menuItems === null || !this.menuItems[i].submenu)
            return;
        new Menu(this.menuItems[i].submenu).popup({ x: this.element.children[i].offsetLeft, y: 16 });
    }
}
//# sourceMappingURL=Toolbar.js.map