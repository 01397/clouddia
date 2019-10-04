import DiagramView from './components/DiagramView.js';
import FileSettingView from './components/FileSettingView.js';
import Sidebar from './components/Sidebar.js';
import StartView from './components/StartView.js';
import StationSettingView from './components/StationSettingView.js';
import StationTimetableView from './components/StationTimetableView.js';
import Subview from './components/Subview.js';
import Tabbar from './components/Tabbar.js';
import Toolbar from './components/Toolbar.js';
import TrainSubview from './components/TrainSubview.js';
import TrainTimetableView from './components/TrainTimetableView.js';
import TrainTypeSettingView from './components/TrainTypeSettingView.js';
import View, { viewTypeString } from './components/View.js';
import DiagramParser, { DiagramFile, Train } from './DiagramParser.js';
import { h } from './Util.js';

export interface SelectionObject {
  train?: Train;
  stationIndex?: number;
  cellType?: string;
  selectType: string;
}

export interface MenuItem {
  label?: string;
  click?: () => void;
  accelerator?: string;
  submenu?: MenuItem[];
  enabled?: boolean;
  visible?: boolean;
  checked?: boolean;
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
  role?:
    | 'undo'
    | 'redo'
    | 'cut'
    | 'copy'
    | 'paste'
    | 'pasteAndMatchStyle'
    | 'selectAll'
    | 'delete'
    | 'minimize'
    | 'close'
    | 'quit'
    | 'reload'
    | 'forceReload'
    | 'toggleDevTools'
    | 'togglefullscreen'
    | 'resetZoom'
    | 'zoomIn'
    | 'zoomOut'
    | 'fileMenu'
    | 'editMenu'
    | 'viewMenu'
    | 'windowMenu'
    | 'appMenu'
    | 'about'
    | 'hide'
    | 'hideOthers'
    | 'unhide'
    | 'startSpeaking'
    | 'stopSpeaking'
    | 'front'
    | 'zoom'
    | 'toggleTabBar'
    | 'selectNextTab'
    | 'selectPreviousTab'
    | 'mergeAllWindows'
    | 'moveTabToNewWindow'
    | 'window'
    | 'help'
    | 'services'
    | 'recentDocuments'
    | 'clearRecentDocuments';
}

export default class App {
  public data: DiagramFile;
  public mainElm: Element;
  public subElm: Element;
  public main: View;
  public sub: Subview;
  public sidebarElm: Element;
  public toolbarElm: Element;
  public tabbarElm: Element;
  public currentView: viewTypeString;
  public version: string;
  public rootElm: Element;
  public sidebar: Sidebar;
  public tabbar: Tabbar;
  public toolbar: Toolbar;
  public currentDiaIndex: number;
  public _selection: SelectionObject[];

  constructor(root: Element) {
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
  public showFileSettingView(viewId: number) {
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
  public showTrainTimetableView(diaIndex: number = null, direction: number) {
    if (diaIndex === null) diaIndex = this.currentDiaIndex;
    else this.currentDiaIndex = diaIndex;
    this.main = new TrainTimetableView(this, diaIndex, direction);
    this.sidebar.status = direction + 1;
    this.sub.show();
    this.tabbar.status = 'diagram';
  }
  /**
   * 駅時刻表(StationTimetableView)の表示
   * @param diaIndex 何番目のダイヤか
   */
  public showStationTimetableView(diaIndex: number = null) {
    if (diaIndex === null) diaIndex = this.currentDiaIndex;
    else this.currentDiaIndex = diaIndex;
    this.main = new StationTimetableView(this, diaIndex);
    this.sidebar.status = 3;
    this.sub.show();
    this.tabbar.status = 'diagram';
  }
  /**
   * ダイヤグラム(DiagramView)の表示
   * @param diaIndex 何番目のダイヤか
   */
  public showDiagramView(diaIndex: number = null) {
    if (diaIndex === null) diaIndex = this.currentDiaIndex;
    else this.currentDiaIndex = diaIndex;
    this.main = new DiagramView(this, diaIndex);
    this.sidebar.status = 4;
    this.sub.show();
    this.tabbar.status = 'diagram';
  }
  set selection(selection: SelectionObject[]) {
    this._selection = selection;
    if (this.sub instanceof TrainSubview) {
      this.sub.update(selection);
    }
  }
  get selection() {
    return this._selection;
  }
  public save() {
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
    }) as HTMLAnchorElement;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }
  public loadOudia(oudstring: string, fileName: string): void {
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
      .catch((e: Error) => {
        // tslint:disable-next-line: no-console
        console.error('parse error.', e);
      });
  }
  public loadOnlineFile(fileURL: string) {
    const url = 'http://soasa.starfree.jp/fileRequest.php?url=' + fileURL;
    fetch(url, { mode: 'cors' })
      .then(response => response.blob())
      .then(
        blob =>
          new Promise(() => {
            const reader = new FileReader();
            reader.onload = () => this.loadOudia(reader.result as string, 'Web上のファイル');
            reader.readAsText(blob, 'shift-jis');
          })
      )
      .catch(err => {
        throw err;
      });
  }
  public setViewMenu(viewMenu: MenuItem[]) {
    const menu: MenuItem[] = [
      {
        label: 'ファイル',
        submenu: [
          {
            label: '保存',
            accelerator: 'CmdOrCtrl+S',
            click: () => this.save(),
          } as MenuItem,
        ],
      },
      ...viewMenu,
    ];
    this.toolbar.setMenu(menu);
  }
  private updateLocalData() {
    try {
      window.localStorage.setItem('test', 'storage test.');
      window.localStorage.getItem('test');
      const version = window.localStorage.getItem('version');
      if (version === this.version) return;
      window.localStorage.setItem('version', this.version);
    } catch (err) {
      console.log(err);
    }
  }
}
