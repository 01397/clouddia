import App from '../App.js';
import { h } from '../Util.js';
import { Diagram } from '../DiagramParser.js';
export default class Tabbar {
  private element: Element;
  private selectedTab: Element;
  private app: App;
  private _status: string;
  constructor(app: App, element: Element) {
    this.app = app;
    this.element = element;
    this.selectedTab = null;
    this.status = 'blank';
  }
  set status(value: 'blank' | 'diagram' | 'settings') {
    if (this._status === value) return;
    this._status = value;
    switch (value) {
      case 'blank':
        this.element.innerHTML = '';
        break;
      case 'diagram':
        this.showDiagramTabs();
        break;
      case 'settings':
        this.showSettingTabs();
        break;
    }
  }
  private showDiagramTabs() {
    const elements = [
      ...this.app.data.railway.diagrams.map(
        (diagram, i): Element =>
          h(
            'div',
            {
              class: 'tabbar-tab' + (i === 0 ? ' active' : ''),
              'data-tab-id': i,
            },
            diagram.name,
            this.tabClicked.bind(this)
          )
      ),
      h('div', { class: 'tabbar-tab' }, '＋', this.addDiagram.bind(this)),
    ];
    this.selectedTab = elements[0];
    this.element.innerHTML = '';
    this.element.append(...elements);
  }
  private showSettingTabs() {
    const elements = [
      h('div', { class: 'tabbar-tab tabbar-setting-tab active', 'data-tab-id': '0' }, '基本設定', this.tabClicked.bind(this)),
      h('div', { class: 'tabbar-tab tabbar-setting-tab', 'data-tab-id': '1' }, '駅', this.tabClicked.bind(this)),
      h(
        'div',
        { class: 'tabbar-tab tabbar-setting-tab', 'data-tab-id': '2' },
        '種別',
        this.tabClicked.bind(this)
      ) /*,
      h('div', { class: 'tabbar-tab tabbar-setting-tab', 'data-tab-id': '3' }, 'ダイヤ', this.tabClicked.bind(this))*/,
    ];
    this.selectedTab = elements[0];
    this.element.innerHTML = '';
    this.element.append(...elements);
  }
  private addDiagram() {
    this.app.data.railway.diagrams.push(new Diagram());
    this.showDiagramTabs();
  }
  private tabClicked(e: Event) {
    this.changeTab(Number((e.currentTarget as HTMLElement).dataset.tabId));
  }
  private changeTab(tabId: number) {
    const target = this.element.children[tabId];
    if (!target) return;
    if (this.selectedTab !== null) {
      this.selectedTab.classList.remove('active');
    }
    target.classList.add('active');
    this.selectedTab = target;
    switch (this.app.currentView) {
      case 'InboundTrainTimetable':
        this.app.showTrainTimetableView(tabId, 1);
        break;
      case 'OutboundTrainTimetable':
        this.app.showTrainTimetableView(tabId, 0);
        break;
      case 'Diagram':
        this.app.showDiagramView(tabId);
        break;
      case 'StationTimetable':
        this.app.showStationTimetableView(tabId);
        break;
      case 'FileSetting':
        this.app.showFileSettingView(tabId);
        break;
    }
  }
}
