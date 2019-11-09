import App from '../App.js'
import { h } from '../Util.js'

export default abstract class Subview {
  protected app: App
  protected element: HTMLDivElement
  protected visible: boolean
  constructor(app: App) {
    this.app = app

    // お疲れ様、前subViewの終了
    if (app.sub) app.sub.finish()
    delete app.sub

    // EventListenerなどのしがらみのない、まっとうなDIVを取り戻す
    const newDiv = h('div', { id: 'subView' }) as HTMLDivElement
    newDiv.style.display = 'none'
    this.visible = false
    app.subElm.replaceWith(newDiv)
    app.subElm = newDiv
    this.element = newDiv
  }
  public show() {
    if (this.visible) return
    this.element.style.display = 'block'
    this.visible = true
  }
  public hide() {
    if (!this.visible) return
    this.element.style.display = 'none'
    this.visible = false
  }
  public abstract finish(): void
}
