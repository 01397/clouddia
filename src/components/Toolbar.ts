import App, { MenuItem } from '../App.js';
import { h } from '../Util.js';
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
    console.log(i);
    if (!this.menu[i].submenu) return;
    const menuElement = h(
      'div',
      { class: 'menu-container' },
      this.menu[i].submenu.map(item =>
        h('div', { class: 'menu-item' }, item.label, item.click)
      )
    ) as HTMLDivElement;
    menuElement.style.top = '16px';
    menuElement.style.left =
      (this.element.children[i] as HTMLElement).offsetLeft + 'px';
    document.body.appendChild(menuElement);
    document.body.addEventListener(
      'click',
      () => document.body.removeChild(menuElement),
      { once: true, capture: false }
    );
  }
}
