import App, { MenuItem } from '../App.js'
import { h, Menu } from '../Util.js'
export default class Toolbar {
  private element: Element
  private app: App
  private menuItems: MenuItem[]
  constructor(app: App, element: Element) {
    this.app = app
    this.element = element
    this.menuItems = null
    this.element.innerHTML = ''
  }
  public setMenu(menuItems: MenuItem[]) {
    this.menuItems = menuItems
    const menuWrapper = h(
      'div',
      { id: 'toolbar' },
      menuItems.map((item, i) =>
        h('div', { class: 'toolbar-item' }, item.label, e => {
          e.stopPropagation()
          this.showMenu(i)
        })
      )
    )
    this.element.replaceWith(menuWrapper)
    this.element = menuWrapper
  }
  private showMenu(i: number) {
    if (!this.menuItems[i].submenu) return
    new Menu(this.menuItems[i].submenu).popup({ x: (this.element.children[i] as HTMLElement).offsetLeft, y: 16 })
  }
}
