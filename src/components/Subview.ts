import { h } from "../Util.js";
import App from "../App.js";

export default class Subview {
  app: App;
  element: HTMLDivElement;
  visible: boolean;
  constructor(app:App) {
    this.app = app;

    // お疲れ様、前subViewの終了
    if (app.sub) app.sub.finish();
    delete app.sub;

    // EventListenerなどのしがらみのない、まっとうなDIVを取り戻す
    let newDiv = h('div', {id: 'subView'}) as HTMLDivElement;
    app.subElm.replaceWith(newDiv);
    app.subElm = newDiv;
    this.element = newDiv;
  }
  show() {
    if(this.visible)return;
    this.element.style.display = 'block';
    this.visible = true;;
  }
  hide() {
    if(!this.visible)return;
    this.element.style.display = 'none';
    this.visible = false;;
  }
  finish(){}
}