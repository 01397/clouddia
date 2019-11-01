import App, { MenuItem } from '../App.js';
import { h, Menu } from '../Util.js';
export default class Toolbar {
  private element: Element;
  private app: App;
  menu: MenuItem[];
  constructor(app: App, element: Element) {
    this.app = app;
    this.element = element;
    this.menu = null;
    this.element.innerHTML = '';
  }
  public setMenu(menu: MenuItem[]) {
    this.menu = menu;
    const menuWrapper = h(
      'div',
      { id: 'toolbar' },
      menu.map((item, i) =>
        h('div', { class: 'toolbar-item' }, item.label, e => {
          e.stopPropagation();
          this.showMenu(i);
        })
      )
    );
    this.element.replaceWith(menuWrapper);
    this.element = menuWrapper;
  }
  private showMenu(i: number) {
    if (!this.menu[i].submenu) return;
    new Menu(this.menu[i].submenu).show((this.element.children[i] as HTMLElement).offsetLeft, 16);
  }
}
