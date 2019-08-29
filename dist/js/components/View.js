import { h } from '../Util.js';
export default class View {
    constructor(app, viewType) {
        this.app = app;
        this.app.currentView = viewType;
        // お疲れ様、前mainViewの終了
        if (app.main)
            app.main.finish();
        delete app.main;
        // EventListenerなどのしがらみのない、まっとうなDIVを取り戻す
        const newDiv = h('div', { id: 'mainContainer' });
        app.mainElm.replaceWith(newDiv);
        app.mainElm = newDiv;
        this.element = newDiv;
    }
}
//# sourceMappingURL=View.js.map