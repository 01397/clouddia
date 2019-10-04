import DiagramView from './components/DiagramView.js';
import FileSettingView from './components/FileSettingView.js';
import Sidebar from './components/Sidebar.js';
import StartView from './components/StartView.js';
import StationSettingView from './components/StationSettingView.js';
import StationTimetableView from './components/StationTimetableView.js';
import Tabbar from './components/Tabbar.js';
import Toolbar from './components/Toolbar.js';
import TrainSubview from './components/TrainSubview.js';
import TrainTimetableView from './components/TrainTimetableView.js';
import TrainTypeSettingView from './components/TrainTypeSettingView.js';
import DiagramParser from './DiagramParser.js';
import { h } from './Util.js';
export default class App {
    constructor(root) {
        this.version = '0.2.1';
        this.sidebarElm = h('aside', { id: 'sidebar' }, null);
        this.toolbarElm = h('div', { id: 'toolbar' }, null);
        this.tabbarElm = h('div', { id: 'tabbar' }, null);
        this.mainElm = h('div', { id: 'mainContainer' }, null);
        this.subElm = h('div', { id: 'subContainer' }, null);
        this.rootElm = h('div', { id: 'app' }, [
            this.sidebarElm,
            h('main', { id: 'main' }, [
                h('div', { id: 'header' }, [h('div', { id: 'header-container' }, [this.toolbarElm, this.tabbarElm])]),
                h('div', { id: 'bottom-container' }, [this.mainElm, this.subElm]),
            ]),
        ]);
        root.replaceWith(this.rootElm);
        this.currentView = null;
        this.sidebar = null;
        this.tabbar = null;
        this.toolbar = new Toolbar(this, this.toolbarElm);
        this.main = new StartView(this);
        this.sub = null;
        this.data = null;
        this.currentDiaIndex = 0;
        this._selection = null;
        this.updateLocalData();
    }
    /**
     * ファイルに関する設定(FileSettingView)の表示
     */
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
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
        //const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
        const unicodeArray = [];
        const oudiaString = this.data.toOudiaString();
        for (let i = 0; i < oudiaString.length; i++) {
            unicodeArray.push(oudiaString.charCodeAt(i));
        }
        // Encodingはencoding.jsの力を借ります。
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const shiftJISArray = Encoding.convert(unicodeArray, 'sjis', 'unicode');
        const shiftJISuInt8 = new Uint8Array(shiftJISArray);
        const anchor = h('a', {
            href: URL.createObjectURL(new Blob([shiftJISuInt8], { type: 'text/plain' })),
            download: 'test.oud',
            style: 'display: none',
        });
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    }
    loadOudia(oudstring, fileName) {
        const parser = new DiagramParser();
        console.log('loading: ' + fileName);
        parser
            .parse(oudstring)
            .then(result => {
            console.log('loaded.');
            // tslint:disable-next-line: no-console
            console.log(result);
            this.data = result;
            this.sidebar = new Sidebar(this, this.sidebarElm);
            this.tabbar = new Tabbar(this, this.tabbarElm);
            this.sub = new TrainSubview(this, 0);
            this.showTrainTimetableView(0, 0);
        })
            .catch((e) => {
            // tslint:disable-next-line: no-console
            console.error('parse error.', e);
        });
    }
    loadOnlineFile(fileURL) {
        const url = 'http://soasa.starfree.jp/fileRequest.php?url=' + fileURL;
        fetch(url, { mode: 'cors' })
            .then(response => response.blob())
            .then(blob => new Promise(() => {
            const reader = new FileReader();
            reader.onload = () => this.loadOudia(reader.result, 'Web上のファイル');
            reader.readAsText(blob, 'shift-jis');
        }))
            .catch(err => {
            throw err;
        });
    }
    setViewMenu(viewMenu) {
        const menu = [
            {
                label: 'ファイル',
                submenu: [
                    {
                        label: '保存',
                        accelerator: 'CmdOrCtrl+S',
                        click: () => this.save(),
                    },
                ],
            },
            ...viewMenu,
        ];
        this.toolbar.setMenu(menu);
    }
    updateLocalData() {
        try {
            window.localStorage.setItem('test', 'storage test.');
            window.localStorage.getItem('test');
            const version = window.localStorage.getItem('version');
            if (version === this.version)
                return;
            window.localStorage.setItem('version', this.version);
        }
        catch (err) {
            console.log(err);
        }
    }
}
//# sourceMappingURL=App.js.map