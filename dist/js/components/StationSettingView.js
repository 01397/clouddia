import { Station } from '../DiagramParser.js';
import { createButton, createCheckbox, createRadio, createTextField, h } from '../Util.js';
import View from './View.js';
export default class StationSettingView extends View {
    // TODO: 駅,番線の挿入,削除後に列車時刻表を直さなきゃ
    constructor(app) {
        super(app, 'FileSetting');
        this.rowHeight = 56;
        this.hoverElement = null;
        this.svgElement = h('svg', { class: 'fs-station-railmap' }, null, null, 'http://www.w3.org/2000/svg');
        this.svgElement.addEventListener('mousemove', (e) => {
            const y = e.offsetY;
            if (this.hoverElement !== null)
                this.hoverElement.classList.remove('hover');
            if (y % this.rowHeight < 28) {
                this.hoverElement = null;
                this.insertButton.style.transform = 'translateY(' + (Math.floor(y / this.rowHeight) * this.rowHeight + 12) + 'px)';
                this.insertButton.style.display = 'inline';
            }
            else {
                const target = this.svgElement.querySelectorAll('g')[Math.floor(y / this.rowHeight)];
                if (!target)
                    return;
                this.hoverElement = target;
                target.classList.add('hover');
                this.insertButton.style.display = 'none';
            }
        });
        this.svgElement.addEventListener('mouseout', (e) => {
            if (this.hoverElement !== null)
                this.hoverElement.classList.remove('hover');
            this.insertButton.style.display = 'none';
        });
        this.svgElement.addEventListener('click', (e) => {
            const y = e.offsetY;
            if (y % this.rowHeight < 28) {
                this.insertStation(Math.floor(y / this.rowHeight));
            }
            else {
                this.editStation(Math.floor(y / this.rowHeight));
            }
        });
        this.rightContainer = h('div', { class: 'fs-right-container' }, '駅が選択されていません');
        this.element.appendChild(h('div', { class: 'fs-2cols-container' }, [
            h('div', { class: 'fs-left-container' }, this.svgElement),
            this.rightContainer,
        ]));
        this.updateRailmap();
    }
    finish() {
        return;
    }
    editStation(stationIndex) {
        const station = this.app.data.railway.stations[stationIndex];
        const content = [
            h('div', { class: 'fs-section .fs-label5' }, [
                h('div', { class: 'fs-section-header' }, '名称'),
                h('div', { class: 'form-row' }, [
                    h('div', { class: 'form-label' }, '駅名'),
                    createTextField(station.name, '', '', null, (e) => {
                        const value = e.currentTarget.value;
                        this.svgElement.querySelectorAll('.fs-railmap-station')[stationIndex].textContent = value;
                        station.name = value;
                    }),
                ]),
                h('div', { class: 'form-row' }, [
                    h('div', { class: 'form-label' }, '駅名略称'),
                    createTextField(station.abbrName, '', '', (e) => {
                        station.abbrName = e.currentTarget.value;
                    }),
                ]),
            ]),
            h('div', { class: 'fs-section .fs-label5' }, [
                h('div', { class: 'fs-section-header' }, '表示'),
                h('div', { class: 'form-row' }, [
                    h('div', { class: 'form-label' }, '駅規模'),
                    h('label', { class: 'fs-label' }, [
                        createCheckbox(station.isMain, null, (e) => {
                            const value = e.currentTarget.checked;
                            station.isMain = value;
                            this.svgElement.querySelectorAll('g')[stationIndex].classList[value ? 'add' : 'remove']('fs-railmap-main');
                        }),
                        h('div', { class: 'fs-text' }, '主要駅'),
                    ]),
                ]),
                h('div', { class: 'form-row' }, [
                    h('div', { class: 'form-label' }, '上り列車'),
                    h('label', { class: 'fs-label' }, [
                        createCheckbox(station.timetableStyle.arrival[0], '', (e) => {
                            station.timetableStyle.arrival[0] = e.currentTarget.checked;
                        }),
                        h('div', { class: 'fs-text' }, '着時刻'),
                    ]),
                    h('label', { class: 'fs-label' }, [
                        createCheckbox(station.timetableStyle.departure[0], '', (e) => {
                            station.timetableStyle.departure[0] = e.currentTarget.checked;
                        }),
                        h('div', { class: 'fs-text' }, '発時刻'),
                    ]),
                ]),
                h('div', { class: 'form-row' }, [
                    h('div', { class: 'form-label' }, '下り列車'),
                    h('label', { class: 'fs-label' }, [
                        createCheckbox(station.timetableStyle.arrival[1], '', (e) => {
                            station.timetableStyle.arrival[1] = e.currentTarget.checked;
                        }),
                        h('div', { class: 'fs-text' }, '着時刻'),
                    ]),
                    h('label', { class: 'fs-label' }, [
                        createCheckbox(station.timetableStyle.departure[1], '', (e) => {
                            station.timetableStyle.departure[1] = e.currentTarget.checked;
                        }),
                        h('div', { class: 'fs-text' }, '発時刻'),
                    ]),
                ]),
            ]),
            h('div', { class: 'fs-section .fs-label5' }, [
                h('div', { class: 'fs-section-header' }, '番線'),
                h('div', { class: 'fs-track-grid' }, [
                    h('div', { class: 'form-label', style: 'grid-row: 1;grid-column:1;' }, '番線名'),
                    h('div', { class: 'form-label', style: 'grid-row: 1;grid-column:2;' }, '下り略称'),
                    h('div', { class: 'form-label', style: 'grid-row: 1;grid-column:3;' }, '上り略称'),
                    h('div', { class: 'form-label', style: 'grid-row: 1;grid-column:4;' }, '上り 主本線'),
                    h('div', { class: 'form-label', style: 'grid-row: 1;grid-column:5;' }, '下り 主本線'),
                    h('div', { style: 'grid-row: 1;grid-column:6;' }),
                    ...station.tracks.map((track, i) => {
                        const fragment = document.createDocumentFragment();
                        fragment.append(...[
                            createTextField(track.name, '', '', (e) => {
                                const value = e.currentTarget.value;
                                if (value !== '') {
                                    track.name = value;
                                }
                                else {
                                    e.currentTarget.value = track.name;
                                }
                            }),
                            createTextField(track.abbrName[0], '', '', (e) => track.abbrName[0] = e.currentTarget.value),
                            createTextField(track.abbrName[1] === '' ? track.abbrName[0] : track.abbrName[1], '', '', (e) => {
                                const value = e.currentTarget.value;
                                track.abbrName[1] = track.abbrName[0] === value ? '' : value;
                            }),
                            createRadio(station.mainTrack[0] === i, 'fs-inbound', '', (e) => station.mainTrack[0] = i),
                            createRadio(station.mainTrack[1] === i, 'fs-outbound', '', (e) => station.mainTrack[1] = i),
                            createButton('削除', 'form-button-red', () => {
                                station.tracks.splice(i, 1);
                                this.editStation(stationIndex);
                            }),
                        ]);
                        return fragment;
                    }),
                    createButton('＋番線追加', '', () => {
                        station.addTrack();
                        this.editStation(stationIndex);
                    }),
                ]),
            ]),
            h('div', { class: 'fs-section' }, [
                createButton('この駅を削除', 'form-button-red', () => {
                    this.removeStation(stationIndex);
                }),
            ]),
        ];
        this.rightContainer.innerHTML = '';
        this.rightContainer.append(...content);
    }
    insertStation(stationIndex) {
        const stations = this.app.data.railway.stations;
        stations.splice(stationIndex, 0, new Station());
        stations.forEach((station) => {
            if (station.brunchCoreStationIndex !== null && station.brunchCoreStationIndex >= stationIndex) {
                station.brunchCoreStationIndex++;
            }
            if (station.loopOriginStationIndex !== null && station.loopOriginStationIndex >= stationIndex) {
                station.loopOriginStationIndex++;
            }
        });
        this.updateRailmap();
        this.editStation(stationIndex);
    }
    removeStation(stationIndex) {
        const stations = this.app.data.railway.stations;
        stations.splice(stationIndex, 1);
        stations.forEach((station) => {
            if (station.brunchCoreStationIndex !== null && station.brunchCoreStationIndex >= stationIndex) {
                station.brunchCoreStationIndex--;
            }
            if (station.loopOriginStationIndex !== null && station.loopOriginStationIndex >= stationIndex) {
                station.loopOriginStationIndex--;
            }
        });
        this.updateRailmap();
        this.editStation(stationIndex);
    }
    updateRailmap() {
        const stations = this.app.data.railway.stations;
        const layer1 = [];
        const layer2 = [];
        this.svgElement.setAttribute('height', String(stations.length * this.rowHeight));
        for (let i = 0; i < stations.length; i++) {
            const content = [];
            const y = this.rowHeight * i + 24;
            if (stations[i].brunchCoreStationIndex !== null) {
                // 分岐の端っこ
                content.push(h('text', {
                    class: 'fs-railmap-station fs-railmap-station-small',
                    x: 64,
                    y: y + 20,
                }, '(' + stations[i].name + ')', null, 'http://www.w3.org/2000/svg'), h('circle', {
                    class: 'fs-railmap-circle',
                    cx: 44,
                    cy: y + 16,
                    r: 4,
                }, null, null, 'http://www.w3.org/2000/svg'));
                const dy = stations[i].brunchCoreStationIndex - i;
                layer2.push(h('path', {
                    class: 'fs-railmap-line',
                    d: `M44 ${y + 16} c-36 0, -36 ${dy * this.rowHeight}, 0 ${dy * this.rowHeight}`,
                }, null, null, 'http://www.w3.org/2000/svg'));
            }
            else {
                content.push(h('text', {
                    class: 'fs-railmap-station',
                    x: 64,
                    y: y + 20,
                }, stations[i].name, null, 'http://www.w3.org/2000/svg'), h('circle', {
                    class: 'fs-railmap-circle',
                    cx: 44,
                    cy: y + 16,
                    r: 12,
                }, null, null, 'http://www.w3.org/2000/svg'), h('text', {
                    class: 'fs-railmap-tracks',
                    x: 44,
                    y: y + 20,
                }, stations[i].tracks.length, null, 'http://www.w3.org/2000/svg'));
            }
            layer1.push(h('g', { class: stations[i].isMain ? 'fs-railmap-main' : '' }, content, null, 'http://www.w3.org/2000/svg'));
            // 駅間
            if ((stations[i].brunchCoreStationIndex === null || stations[i].brunchCoreStationIndex < i) &&
                (i + 1) in stations &&
                (stations[i + 1].brunchCoreStationIndex === null || stations[i + 1].brunchCoreStationIndex > i + 1)) {
                layer2.push(h('line', {
                    class: 'fs-railmap-line',
                    x1: 44,
                    x2: 44,
                    y1: y + 16,
                    y2: y + this.rowHeight + 16,
                }, null, null, 'http://www.w3.org/2000/svg'));
            }
        }
        this.insertButton = h('g', { class: 'fs-railmap-insert' }, [
            h('line', { x1: 0, x2: 300, y1: 0.5, y2: 0, 'stroke-dasharray': '2 1' }, null, null, 'http://www.w3.org/2000/svg'),
            h('circle', { cx: 44, cy: 0, r: 8 }, null, null, 'http://www.w3.org/2000/svg'),
            h('path', { d: 'M44 -4 l0 8m-4 -4l 8 0' }, null, null, 'http://www.w3.org/2000/svg'),
        ], null, 'http://www.w3.org/2000/svg');
        this.svgElement.innerHTML = '';
        this.svgElement.append(...layer2, ...layer1, this.insertButton);
    }
}
//# sourceMappingURL=StationSettingView.js.map