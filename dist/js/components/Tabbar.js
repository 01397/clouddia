import { h } from '../Util.js';
export default class Tabbar {
    constructor(app, element) {
        this.app = app;
        this.element = element;
        this.selectedTab = null;
        this.status = 'blank';
    }
    set status(value) {
        if (this._status === value)
            return;
        this._status = value;
        switch (value) {
            case 'diagram':
                this.showDiagramTabs();
                break;
            case 'settings':
                this.showSettingTabs();
                break;
        }
    }
    showDiagramTabs() {
        const elements = this.app.data.railway.diagrams.map((diagram, i) => h('div', { class: 'tabbar-tab' + (i === 0 ? ' active' : ''), 'data-tab-id': i }, diagram.name, this.tabClicked.bind(this)));
        this.selectedTab = elements[0];
        this.element.innerHTML = '';
        this.element.append(...elements);
    }
    showSettingTabs() {
        const elements = [
            h('div', { class: 'tabbar-tab tabbar-setting-tab active', 'data-tab-id': '0' }, '基本設定', this.tabClicked.bind(this)),
            h('div', { class: 'tabbar-tab tabbar-setting-tab', 'data-tab-id': '1' }, '駅', this.tabClicked.bind(this)),
            h('div', { class: 'tabbar-tab tabbar-setting-tab', 'data-tab-id': '2' }, '種別', this.tabClicked.bind(this)),
        ];
        this.selectedTab = elements[0];
        this.element.innerHTML = '';
        this.element.append(...elements);
    }
    tabClicked(e) {
        this.changeTab(Number(e.currentTarget.dataset.tabId));
    }
    changeTab(tabId) {
        const target = this.element.children[tabId];
        if (!target)
            return;
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
//# sourceMappingURL=Tabbar.js.map