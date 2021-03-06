import { h } from '../Util.js';
export default class Subview {
    constructor(app) {
        this.app = app;
        // お疲れ様、前subViewの終了
        if (app.sub)
            app.sub.finish();
        // @ts-ignore
        delete app.sub;
        // EventListenerなどのしがらみのない、まっとうなDIVを取り戻す
        const newDiv = h('div', { id: 'subView' });
        newDiv.style.display = 'none';
        this.visible = false;
        app.subElm.replaceWith(newDiv);
        app.subElm = newDiv;
        this.element = newDiv;
    }
    show() {
        if (this.visible)
            return;
        this.element.style.display = 'block';
        this.visible = true;
    }
    hide() {
        if (!this.visible)
            return;
        this.element.style.display = 'none';
        this.visible = false;
    }
}
//# sourceMappingURL=Subview.js.map