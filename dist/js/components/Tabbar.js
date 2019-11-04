import { h, Menu } from '../Util.js';
import { Diagram } from '../DiagramParser.js';
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
    showDiagramTabs() {
        const elements = [
            ...this.app.data.railway.diagrams.map((diagram, i) => {
                const result = h('div', {
                    class: 'tabbar-tab' + (i === 0 ? ' active' : ''),
                    'data-tab-id': i,
                }, diagram.name, this.tabClicked.bind(this));
                result.addEventListener('contextmenu', (event) => {
                    const menu = [
                        {
                            label: '名前の変更',
                            click: () => this.renameDiagram(i),
                        },
                    ];
                    new Menu(menu).popup({ x: event.clientX, y: event.clientY });
                    event.preventDefault();
                });
                return result;
            }),
            h('div', { class: 'tabbar-tab' }, '＋', this.addDiagram.bind(this)),
        ];
        this.selectedTab = elements[0];
        this.element.innerHTML = '';
        this.element.append(...elements);
    }
    renameDiagram(id) {
        const tabElement = this.element.children[id];
        const input = h('input', { class: 'tabbar-input', value: tabElement.textContent });
        tabElement.innerHTML = '';
        tabElement.appendChild(input);
        input.addEventListener('keydown', event => {
            if (event.keyCode === 13) {
                input.blur();
            }
            event.stopPropagation();
        });
        input.addEventListener('click', event => event.stopPropagation());
        input.addEventListener('blur', () => {
            const value = input.value;
            this.app.data.railway.diagrams[id].name = value;
            tabElement.textContent = value;
        });
    }
    showSettingTabs() {
        const elements = [
            h('div', { class: 'tabbar-tab tabbar-setting-tab active', 'data-tab-id': '0' }, '基本設定', this.tabClicked.bind(this)),
            h('div', { class: 'tabbar-tab tabbar-setting-tab', 'data-tab-id': '1' }, '駅', this.tabClicked.bind(this)),
            h('div', { class: 'tabbar-tab tabbar-setting-tab', 'data-tab-id': '2' }, '種別', this.tabClicked.bind(this)) /*,
            h('div', { class: 'tabbar-tab tabbar-setting-tab', 'data-tab-id': '3' }, 'ダイヤ', this.tabClicked.bind(this))*/,
        ];
        this.selectedTab = elements[0];
        this.element.innerHTML = '';
        this.element.append(...elements);
    }
    addDiagram() {
        this.app.data.railway.diagrams.push(new Diagram());
        this.showDiagramTabs();
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