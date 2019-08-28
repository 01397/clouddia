import { h } from "../Util.js";
export default class Subview {
    constructor(app) {
        this.app = app;
        // お疲れ様、前subViewの終了
        if (app.sub)
            app.sub.finish();
        delete app.sub;
        // EventListenerなどのしがらみのない、まっとうなDIVを取り戻す
        let newDiv = h('div', { id: 'subView' });
        app.subElm.replaceWith(newDiv);
        app.subElm = newDiv;
        this.element = newDiv;
    }
    show() {
        if (this.visible)
            return;
        this.element.style.display = 'block';
        this.visible = true;
        ;
    }
    hide() {
        if (!this.visible)
            return;
        this.element.style.display = 'none';
        this.visible = false;
        ;
    }
    finish() { }
}
//# sourceMappingURL=Subview.js.map