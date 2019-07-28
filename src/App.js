"use strict";

import TrainTimetableView from "./TrainTimetableView.js";
import DiagramView from "./DiagramView.js";
import Sidebar from "./Sidebar.js";
import ComingSoonView from "./ComingSoonView.js";
import OudiaParser from "./OudiaParser.js";
import WelcomeView from "./WelcomeView.js";
import StationTimetableView from "./StationTimetableView.js";

// App.js (module)
// なんか、ここでメインの処理をすることになったよ〜
const ENCODING_TYPE = 'shift-jis';

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
    showTrainTimetableView(idx, key) {
        this.mainView = new TrainTimetableView(this, idx, key);
    }
    /**
     * まじ、ダイヤ表示すんのしんどいわぁ
     * @param {number} idx 何番目のDia
     */
    showDiagramView(idx) {
        this.mainView = new DiagramView(this, idx);
    }
    showComingSoonView() {
        this.mainView = new ComingSoonView(this);
    }
    showWelcomeView() {
        this.mainView = new WelcomeView(this);
    }
    showStationTimetableView(idx) {
        this.mainView = new StationTimetableView(this, idx);
    }

    /**
 * あぁ〜端末上のouDiaファイルが入ってきたぁぁ。読み込んじゃうよぉお。。
 * @param {string} string ouDiaのファイルの文字列
 */
    loadOudFile(string) {
        this.data = OudiaParser.parse2(string);
        this.showTrainTimetableView(0, 'Kudari');
    }
    loadOudFileLocal(file) {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            this.loadOudFile(reader.result, file.name);
        }, false);
        reader.readAsText(file, ENCODING_TYPE);
    }
    loadOudFileOnline(requestURL) {
        const url = 'http://soasa.starfree.jp/fileRequest.php?url=' + requestURL;
        fetch(url, { mode: 'cors' })
            .then(response => response.blob())
            .then(blob => new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsText(blob, 'shift-jis');
            }))
            .then(text => this.loadOudFile(text, 'Web上のファイル'))
            .catch(err => console.error(err));
    }
}