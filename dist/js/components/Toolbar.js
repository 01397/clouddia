import { h } from '../Util.js';
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
        console.log(i);
        if (!this.menu[i].submenu)
            return;
        const menuElement = h('div', { class: 'menu-container' }, this.menu[i].submenu.map(item => h('div', { class: 'menu-item' }, item.label, item.click)));
        menuElement.style.top = '16px';
        menuElement.style.left = this.element.children[i].offsetLeft + 'px';
        document.body.appendChild(menuElement);
        document.body.addEventListener('click', () => document.body.removeChild(menuElement), {
            once: true,
            capture: false,
        });
    }
}
//# sourceMappingURL=Toolbar.js.map