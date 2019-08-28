import DiagramParser from "./DiagramParser.js";
import { h } from "./Util.js";
import Sidebar from "./components/Sidebar.js";
import Tabbar from "./components/Tabbar.js";
import Toolbar from "./components/Toolbar.js";
import StartView from "./components/StartView.js";
import StationTimetableView from "./components/StationTimetableView.js";
import TrainTimetableView from "./components/TrainTimetableView.js";
import DiagramView from "./components/DiagramView.js";
import TrainSubview from "./components/TrainSubview.js";
import FileSettingView from "./components/FileSettingView.js";
import StationSettingView from "./components/StationSettingView.js";
import TrainTypeSettingView from "./components/TrainTypeSettingView.js";
;
export default class App {
    constructor(root) {
        this.version = 3;
        this.sidebarElm = h('div', { id: "sidebar" }, null);
        this.toolbarElm = h('div', { id: "toolbar" }, null);
        this.tabbarElm = h('div', { id: "tabbar" }, null);
        this.mainElm = h('div', { id: 'mainContainer' }, null);
        this.subElm = h('div', { id: 'subContainer' }, null);
        this.rootElm = h('div', { id: 'app' }, [
            h('div', { id: 'header' }, [
                h('div', { id: 'header-logo' }),
                h('div', { id: 'header-container' }, [
                    this.toolbarElm,
                    this.tabbarElm
                ])
            ]),
            h('div', { id: 'bottom-container' }, [
                this.sidebarElm,
                this.mainElm,
                this.subElm
            ])
        ]);
        root.replaceWith(this.rootElm);
        this.currentView = null;
        this.sidebar = null;
        this.tabbar = null;
        this.toolbar = null;
        this.main = new StartView(this);
        this.sub = null;
        this.data = null;
        this.currentDiaIndex = 0;
        this._selection = null;
    }
    /**
     * ファイルに関する設定(FileSettingView)の表示
     */
    showFileSettingView(viewId) {
        switch (viewId) {
            case 0:
                this.main = new FileSettingView(this);
                break;
            case 1:
                this.main = new StationSettingView(this);
                break;
            case 2:
                this.main = new TrainTypeSettingView(this);
                break;
        }
        this.sidebar.status = 0;
        this.sub.hide();
        this.tabbar.status = 'settings';
    }
    /**
     * 列車時刻表(TrainTimetableView)の表示
     * @param diaIndex 何番目のダイヤか
     * @param direction 0:下り, 1:上り
     */
    showTrainTimetableView(diaIndex = null, direction) {
        if (diaIndex === null)
            diaIndex = this.currentDiaIndex;
        else
            this.currentDiaIndex = diaIndex;
        this.main = new TrainTimetableView(this, diaIndex, direction);
        this.sidebar.status = direction + 1;
        this.sub.show();
        this.tabbar.status = 'diagram';
    }
    /**
     * 駅時刻表(StationTimetableView)の表示
     * @param diaIndex 何番目のダイヤか
     */
    showStationTimetableView(diaIndex = null) {
        if (diaIndex === null)
            diaIndex = this.currentDiaIndex;
        else
            this.currentDiaIndex = diaIndex;
        this.main = new StationTimetableView(this, diaIndex);
        this.sidebar.status = 3;
        this.sub.show();
        this.tabbar.status = 'diagram';
    }
    /**
     * ダイヤグラム(DiagramView)の表示
     * @param diaIndex 何番目のダイヤか
     */
    showDiagramView(diaIndex = null) {
        if (diaIndex === null)
            diaIndex = this.currentDiaIndex;
        else
            this.currentDiaIndex = diaIndex;
        this.main = new DiagramView(this, diaIndex);
        this.sidebar.status = 4;
        this.sub.show();
        this.tabbar.status = 'diagram';
    }
    set selection(selection) {
        this._selection = selection;
        if (this.sub instanceof TrainSubview) {
            this.sub.update(selection);
        }
    }
    get selection() {
        return this._selection;
    }
    save() {
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const unicodeArray = [];
        const oudiaString = this.data.toOudiaString();
        for (let i = 0; i < oudiaString.length; i++) {
            unicodeArray.push(oudiaString.charCodeAt(i));
        }
        // Encodingはencoding.jsの力を借ります。
        // @ts-ignore
        const shiftJISArray = Encoding.convert(unicodeArray, 'sjis', 'unicode');
        const shiftJISuInt8 = new Uint8Array(shiftJISArray);
        const anchor = h('a', {
            href: URL.createObjectURL(new Blob([shiftJISuInt8], { type: 'text/plain' })),
            download: 'test.oud',
            style: 'display: none'
        });
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    }
    loadOudia(oudstring, fileName) {
        const parser = new DiagramParser();
        parser.parse(oudstring)
            .then(result => {
            console.log(result);
            this.data = result;
            this.sidebar = new Sidebar(this, this.sidebarElm);
            this.tabbar = new Tabbar(this, this.tabbarElm);
            this.toolbar = new Toolbar(this, this.toolbarElm);
            this.sub = new TrainSubview(this, 0);
            this.showTrainTimetableView(0, 0);
        }).catch((e) => {
            console.error('parse error.', e);
        });
    }
    loadOnlineFile(fileURL) {
        const url = 'http://soasa.starfree.jp/fileRequest.php?url=' + fileURL;
        fetch(url, { mode: 'cors' })
            .then(response => response.blob())
            .then(blob => new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => this.loadOudia(reader.result, 'Web上のファイル');
            reader.readAsText(blob, 'shift-jis');
        }))
            .catch(err => console.error(err));
    }
}
//# sourceMappingURL=App.js.map