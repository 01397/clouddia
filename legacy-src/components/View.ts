import App, { MenuItem } from '../App.js'
import { h } from '../Util.js'

export type viewTypeString =
  | 'Start'
  | 'StationTimetable'
  | 'InboundTrainTimetable'
  | 'OutboundTrainTimetable'
  | 'Diagram'
  | 'FileSetting'
export default abstract class View {
  protected app: App
  protected element: HTMLDivElement
  constructor(app: App, viewType: viewTypeString, menu: MenuItem[] = []) {
    this.app = app
    this.app.currentView = viewType

    // お疲れ様、前mainViewの終了
    if (app.main) app.main.finish()
    // @ts-ignore
    delete app.main

    // EventListenerなどのしがらみのない、まっとうなDIVを取り戻す
    const newDiv = h('div', { id: 'mainContainer' }) as HTMLDivElement
    app.mainElm.replaceWith(newDiv)
    app.mainElm = newDiv
    this.element = newDiv

    app.setViewMenu(menu)
  }

  public abstract finish(): void
  public keydown(e: KeyboardEvent) {
    return
  }
}
