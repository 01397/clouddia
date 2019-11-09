import { h } from '../Util.js';
export default class Sidebar {
    constructor(app, element) {
        this.app = app;
        this.element = element;
        this.activeItem = null;
        this.visible = false;
    }
    set status(value) {
        if (this.activeItem !== null) {
            this.activeItem.classList.remove('active');
        }
        const target = this.element.children[value + 1];
        if (!target)
            return;
        target.classList.add('active');
        this.activeItem = target;
    }
    show() {
        if (this.visible)
            return;
        const logo = h('div', { id: 'header-logo' }, null, () => this.app.showStartView());
        const file = h('div', { id: 'sidebar-outbound' }, null, () => this.app.showFileSettingView(0));
        file.innerHTML = `<div id="sidebar-outbound"><svg viewBox="0 0 64 64" width="48" height="48">
    <path d="M12 8 l0 48 l40 0 l0 -36 l-12 -12z M40 8 l0 12 l12 0"/>
    </svg><span class="sidebar-label" style="transition-delay:0s">ファイル・路線設定</span></div>`;
        const outbound = h('div', { id: 'sidebar-outbound' }, null, () => this.app.showTrainTimetableView(null, 0));
        outbound.innerHTML = `<div id="sidebar-outbound"><svg viewBox="0 0 64 64" width="48" height="48">
    <rect width="36" height="32" x="7" y="21" rx="4"/>
    <rect width="28" height="18" x="11" y="24" rx="4"/>
    <circle cx="36" cy="47" r="2.5"/>
    <circle cx="14" cy="47" r="2.5"/>
    <line x1="57" x2="42" y1="11" y2="22" />
    <line x1="57" x2="42" y1="41" y2="52" />
    <line x1="23" x2="8" y1="11" y2="22" />
    </svg><span class="sidebar-label" style="transition-delay:0s"><span id="sidebar-label-inbound">${this.app.data.railway.directionName[0]}</span>列車時刻表</span></div>`;
        const inbound = h('div', { id: 'sidebar-inbound' }, null, () => this.app.showTrainTimetableView(null, 1));
        inbound.innerHTML = `<div id="sidebar-inbound"><svg viewBox="0 0 64 64" width="48" height="48">
    <rect width="36" height="32" x="21" y="21" rx="4"/>
    <rect width="28" height="18" x="25" y="24" rx="4"/>
    <circle cx="28" cy="47" r="2.5"/>
    <circle cx="50" cy="47" r="2.5"/>
    <line x1="7" x2="22" y1="11" y2="22" />
    <line x1="7" x2="22" y1="41" y2="52" />
    <line x1="41" x2="56" y1="11" y2="22" />
    </svg><span class="sidebar-label" style="transition-delay:0.05s"><span id="sidebar-label-outbound">${this.app.data.railway.directionName[1]}</span>列車時刻表</span></div>`;
        const station = h('div', { id: 'sidebar-diagram' }, null, () => this.app.showStationTimetableView(null));
        station.innerHTML = `<div id="sidebar-diagram"><svg viewBox="0 0 64 64" width="48" height="48">
    <path d="M12 8 l40 0 a4 4 0 0 1 4 4 l0 24 a4 4 0 0 1 -4 4 l-40 0 a4 4 0 0 1 -4 -4 l0 -24 a4 4 0 0 1 4 -4 M8 56 l0 -28 l48 0 l0 28 M32 28 l0 12"/>
    </svg><span class="sidebar-label" style="transition-delay:0.1s">駅時刻表</span></div>`;
        const diagram = h('div', { id: 'sidebar-diagram' }, null, () => this.app.showDiagramView(null));
        diagram.innerHTML = `<div id="sidebar-diagram"><svg viewBox="0 0 64 64" width="48" height="48">
    <path d="M8 8 l10 12 l12 0 l26 36 M56 8 l-12 24 l-8 0 l-12 24 M8 30 l12 0l11 -22"/>
    </svg><span class="sidebar-label" style="transition-delay:0.15s">ダイヤグラム</span></div>`;
        this.element.innerHTML = '';
        this.element.append(logo, file, outbound, inbound, station, diagram);
        this.visible = true;
    }
    hide() {
        if (!this.visible)
            return;
        this.element.innerHTML = '';
        this.visible = false;
    }
}
//# sourceMappingURL=Sidebar.js.map