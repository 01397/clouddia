import { h } from "../Util.js";
import App from "../App.js";

export type viewTypeString = 'Start' | 'StationTimetable' | 'InboundTrainTimetable' | 'OutboundTrainTimetable' | 'Diagram' | 'FileSetting';
export default class View {
  app: App;
  element: HTMLDivElement;
  constructor(app:App, viewType:viewTypeString) {
    this.app = app;
    this.app.currentView = viewType;

    // お疲れ様、前mainViewの終了
    if (app.main) app.main.finish();
    delete app.main;

    // EventListenerなどのしがらみのない、まっとうなDIVを取り戻す
    let newDiv = h('div', {id: 'mainContainer'}) as HTMLDivElement;
    app.mainElm.replaceWith(newDiv);
    app.mainElm = newDiv;
    this.element = newDiv;
  }
  finish(){}
}