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
import Encoding from 'encoding-japanese';
import { Dialog, h, Menu } from './Util.js';
import './styles/app.css';

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
  public tabbarElm: Element;
  public currentView: viewTypeString;
  public version: string;
  public rootElm: Element;
  public sidebar: Sidebar;
  public tabbar: Tabbar;
  public toolbar: Toolbar;
  public currentDiaIndex: number;
  private sidebarElm: Element;
  private toolbarElm: Element;
  private menu: MenuItem[];

  constructor(root: Element) {
    this.version = import.meta.env.PROD
      ? import.meta.env.VITE_APP_VERSION
      : 'dev-build';
    this.sidebarElm = h('aside', { id: 'sidebar' }, null);
    this.toolbarElm = h('div', { id: 'toolbar' }, null);
    this.tabbarElm = h('div', { id: 'tabbar' }, null);
    this.mainElm = h('div', { id: 'mainContainer' }, null);
    this.subElm = h('div', { id: 'subContainer' }, null);
    this.rootElm = h('div', { id: 'app' }, [
      this.sidebarElm,
      h('main', { id: 'main' }, [
        h('div', { id: 'header' }, [
          h('div', { id: 'header-container' }, [
            this.toolbarElm,
            this.tabbarElm,
          ]),
        ]),
        h('div', { id: 'bottom-container' }, [this.mainElm, this.subElm]),
      ]),
    ]);
    root.replaceWith(this.rootElm);

    this.sidebar = new Sidebar(this, this.sidebarElm);
    this.tabbar = new Tabbar(this, this.tabbarElm);
    this.toolbar = new Toolbar(this, this.toolbarElm);
    this.main = new StartView(this);
    this.sub = new TrainSubview(this, 0);
    this.currentDiaIndex = 0;

    this.updateLocalData();

    document.addEventListener('keydown', (e) => this.keydown(e), false);
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
  public showTrainTimetableView(
    diaIndex: number | null = null,
    direction: 0 | 1 = 0,
    trainId = 0,
    stationId = 0
  ) {
    if (diaIndex === null) diaIndex = this.currentDiaIndex;
    else this.currentDiaIndex = diaIndex;
    this.main = new TrainTimetableView(
      this,
      diaIndex,
      direction,
      trainId,
      stationId
    );
    this.sidebar.status = direction + 1;
    this.sub.show();
    this.tabbar.status = 'diagram';
  }
  /**
   * 駅時刻表(StationTimetableView)の表示
   * @param diaIndex 何番目のダイヤか
   */
  public showStationTimetableView(
    diaIndex: number | null = null,
    direction: 0 | 1 = 0,
    trainId = 0,
    stationId = 0
  ) {
    if (diaIndex === null) diaIndex = this.currentDiaIndex;
    else this.currentDiaIndex = diaIndex;
    this.main = new StationTimetableView(
      this,
      diaIndex,
      direction,
      trainId,
      stationId
    );
    this.sidebar.status = 3;
    this.sub.show();
    this.tabbar.status = 'diagram';
  }
  /**
   * ダイヤグラム(DiagramView)の表示
   * @param diaIndex 何番目のダイヤか
   */
  public showDiagramView(
    diaIndex: number | null = null,
    direction: 0 | 1 = 0,
    trainId: number | null = null,
    stationId: number | null = null
  ) {
    if (diaIndex === null) diaIndex = this.currentDiaIndex;
    else this.currentDiaIndex = diaIndex;
    this.main = new DiagramView(this, diaIndex, direction, trainId, stationId);
    this.sidebar.status = 4;
    this.sub.show();
    this.tabbar.status = 'diagram';
  }
  /**
   * StartViewの表示
   */
  public showStartView() {
    this.main = new StartView(this);
    this.sidebar.status = -1;
    this.sub.hide();
    this.tabbar.status = 'blank';
  }
  public save() {
    //const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const unicodeArray: number[] = [];
    const oudiaString = this.data.saveAsOud('CloudDia ' + this.version);
    for (let i = 0; i < oudiaString.length; i++) {
      unicodeArray.push(oudiaString.charCodeAt(i));
    }
    // Encodingはencoding.jsの力を借ります。
    const shiftJISArray = Encoding.convert(unicodeArray, 'SJIS', 'UNICODE');
    const shiftJISuInt8 = new Uint8Array(shiftJISArray);
    const anchor = h('a', {
      href: URL.createObjectURL(
        new Blob([shiftJISuInt8], { type: 'text/plain' })
      ),
      download: this.data.railway.name + '.oud',
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
      .then((diagram: DiagramFile) => this.initialize(diagram))
      .catch((e: Error) => {
        // tslint:disable-next-line: no-console
        console.error('parse error.', e);
        const dialog = new Dialog({
          title: 'ファイル読み込みエラー',
          message: '時刻表ファイルとして認識できませんでした。',
          buttons: ['OK'],
        });
        dialog.show();
      });
  }
  public initialize(diagram: DiagramFile) {
    console.log('loaded.');
    // tslint:disable-next-line: no-console
    console.log(diagram);
    this.data = diagram;
    this.sidebar.show();
    this.sub.show();
    this.showTrainTimetableView(0, 0);
  }
  public loadOnlineFile(fileURL: string) {
    fetch(fileURL, { mode: 'cors' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTPステータスコード: ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        const reader = new FileReader();
        reader.onload = () =>
          this.loadOudia(reader.result as string, 'Web上のファイル');
        reader.onerror = (e) => {
          const dialog = new Dialog({
            title: 'ファイル読み込みエラー',
            message: 'ファイルの読み取りに失敗しました。',
            buttons: ['OK'],
          });
          dialog.show();
        };
        reader.readAsText(blob, 'shift-jis');
      })
      .catch((err) => {
        const message =
          err instanceof TypeError
            ? 'CORSポリシーにより、読み込みがブロックされている可能性があります。'
            : err instanceof Error
              ? err.message
              : '';
        const dialog = new Dialog({
          title: 'ファイル読み込みエラー',
          message: '指定のURLからファイルを読み込めませんでした。' + message,
          buttons: ['OK'],
        });
        dialog.show();
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
          },
        ],
      },
      ...viewMenu,
      {
        label: '表示',
        submenu: [
          {
            label: 'ファイル,路線設定',
            accelerator: 'CmdOrCtrl+1',
            click: () => this.showFileSettingView(0),
          },
          {
            label: '下り列車時刻表',
            accelerator: 'CmdOrCtrl+2',
            click: () => this.showTrainTimetableView(null, 0),
          },
          {
            label: '上り列車時刻表',
            accelerator: 'CmdOrCtrl+3',
            click: () => this.showTrainTimetableView(null, 1),
          },
          {
            label: '駅時刻表',
            accelerator: 'CmdOrCtrl+4',
            click: () => this.showStationTimetableView(null, 1),
          },
          {
            label: 'ダイヤグラム',
            accelerator: 'CmdOrCtrl+5',
            click: () => this.showDiagramView(null, 1),
          },
        ],
      },
    ];
    this.menu = menu;
    this.toolbar.setMenu(menu);
  }

  private updateLocalData() {
    /*const dialog = new Dialog({
      title: 'ご利用にあたって',
      message:
        'CloudDiaでは、利用状況を調査するためにGoogleアナリティクスを利用しています。Googleアナリティクスは、クッキーを利用して利用者の情報を収集します。CloudDia内の設定によりこれらを無効にすることもできます。',
      buttons: ['詳しく', 'OK'],
      defaultId: 1,
    });
    dialog.show();*/
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

  private keydown(e: KeyboardEvent) {
    const func = Menu.findByShortcut(this.menu, e);
    if (func === null) {
      this.main.keydown(e);
    } else {
      func();
      e.preventDefault();
    }
  }
}
