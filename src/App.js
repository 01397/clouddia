"use strict";

import TrainTimetableView from "./TrainTimetableView.js";
import DiagramView from "./Diagram.js";

// App.js (module)
// なんか、ここでメインの処理をすることになったよ〜

/*****************************
 *   letばっかり使ってないで、   *
 * 積極的にconstを使っていこう！ *
 *****************************/


export default class App {
    constructor() {
        // バージョン？
        this.version = 0.1;
        // JSON形式のouDia
        this._data = null;
        // サイドバーちゃん(≡^oλo^≡)
        this.sidebar = new Sidebar(this);
        this._mainView = null;
    }
    set data(json) {
        this._data = json;
        this.sidebar.render();
    }
    get data() {
        return this._data;
    }
    set mainView(view) {
        // お疲れ様、前mainViewの削除
        if (this._mainView !== null) this._mainView.finish();
        delete this._mainView;

        // EventListenerなどのしがらみのない、まっとうなDIVを取り戻す
        let main = document.getElementById('mainWindow');
        let newDiv = document.createElement('div');
        newDiv.id = 'mainWindow';
        main.replaceWith(newDiv);

        // こんにちは、新mainViewの描画
        this._mainView = view;
        view.render();
    }
    get mainView() {
        return this._mainView;
    }
    /**
     * そ、そんなに列車時刻表が見たいって言うなら、頑張って表示したげるよ？
     * @param {number} idx 何番目のDia
     * @param {string} key 'Nobori' or 'Kudari'
     */
    showTrainTimetable(idx, key) {
        this.mainView = new TrainTimetableView(this, idx, key);
    }
    /**
     * まじ、ダイヤ表示すんのしんどいわぁ
     * @param {number} idx 何番目のDia
     */
    showDiagramView(idx) {
        this.mainView = new DiagramView(this, idx);
    }
    comingSoon(){
        this.mainView = new ComingSoonView();
    }
}
class ComingSoonView{
    constructor(){}
    render(){
        document.getElementById('mainWindow').innerHTML = `<div style="position:absolute;left:${Math.random()*100}px;top:${Math.random()*200}px">まだ作ってる途中です〜〜。</div>`;
    }
    finish(){}
}

class Sidebar {
    constructor(app) {
        this.app = app;
    }
    // サイドバーの更新処理。命名が下手。
    render() {
        let elements = [];
        elements.push(
            h('div', { class: 'sidebar-section' }, [
                h('div', { class: 'sidebar-section-title' }, '路線'),
                h('div', { class: 'sidebar-section-content' }, '駅', () => this.app.comingSoon()),
                h('div', { class: 'sidebar-section-content' }, '種別', () => this.app.comingSoon()),
            ])
        );
        const data = this.app.data;
        data.Rosen[0].Dia.forEach((val, idx) => {
            elements.push(
                h('div', { class: 'sidebar-section' }, [
                    h('div', { class: 'sidebar-section-title' }, val.DiaName),
                    h('div', { class: 'sidebar-section-content' }, '下り列車時刻表', () => this.app.showTrainTimetable(idx, 'Kudari')),
                    h('div', { class: 'sidebar-section-content' }, '上り列車時刻表', () => this.app.showTrainTimetable(idx, 'Nobori')),
                    h('div', { class: 'sidebar-section-content' }, '駅時刻表', () => this.app.comingSoon()),
                    h('div', { class: 'sidebar-section-content' }, 'ダイヤグラム', () => this.app.showDiagramView(idx))
                ])
            );
        });
        document.getElementById('sidebar-menu-wrapper').append(...elements);
        const title = data.Rosen[0].Rosenmei;
        document.getElementById('sidebar-railwayName').textContent = title;
        document.title = title + ' - CloudDia';
    }
}




// https://qiita.com/saekis/items/c2b41cd8940923863791
function x(string) {
    if (typeof string !== 'string') {
        return string;
    }
    return string.replace(/[&'`"<>]/g, function (match) {
        return {
            '&': '&amp;',
            "'": '&#x27;',
            '`': '&#x60;',
            '"': '&quot;',
            '<': '&lt;',
            '>': '&gt;',
        }[match];
    });
}

// DOM生成。
const h = (tag, attr = null, body = null, onclick = null) => {
    const element = document.createElement(tag);
    if (attr != null) {
        for (let key in attr) {
            element.setAttribute(key, attr[key]);
        }
    }
    if (onclick != null) {
        element.addEventListener('click', onclick, false);
    }
    if (typeof body === 'string') {
        element.textContent = body;
    } else if (body instanceof Element) {
        element.appendChild(body);
    } else if (body instanceof Array) {
        body.forEach(elm => {
            element.appendChild(elm);
        });
    } else {
        console.warn('何だお前！: ' + body);
    }
    return element;
};