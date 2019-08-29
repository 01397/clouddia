import { h } from '../Util.js';
import View from './View.js';
export default class StationTimetableView extends View {
    constructor(app, diaIndex) {
        super(app, 'StationTimetable');
        this.diaIndex = diaIndex;
        this.stations = this.app.data.railway.stations;
        this.diagramTitle = this.app.data.railway.diagrams[diaIndex].name;
        this.outboundTrains = this.app.data.railway.diagrams[diaIndex].trains[0];
        this.inboundTrains = this.app.data.railway.diagrams[diaIndex].trains[1];
        // 同一名称の駅を集めて、分岐に対応する。
        this.stationList = {};
        this.stations.forEach((station, idx) => {
            const key = station.name;
            if (!(key in this.stationList)) {
                this.stationList[key] = {
                    indexList: new Set([idx]),
                };
            }
            else {
                this.stationList[key].indexList.add(idx);
            }
        });
        // メインの時刻表部分
        this.timetableElement = h('div');
        // 駅名のプルダウン
        const stationElements = [];
        for (const key in this.stationList) {
            if (!this.stationList.hasOwnProperty(key))
                continue;
            stationElements.push(h('option', { value: key }, key));
        }
        this.stationSelectorElement = h('select', { id: 'stationSelector' }, stationElements);
        this.stationSelectorElement.addEventListener('change', () => this.display(), false);
        // 上り or 下り
        this.directionSelectorElement = h('input', { id: 'directionSelector', type: 'checkbox' });
        this.directionSelectorElement.addEventListener('change', () => this.display(), false);
        const tools = h('div', { id: 'st-tools-wrapper' }, [
            h('div', { id: 'st-tools' }, [
                h('div', { class: 'st-tools-container' }, [
                    h('div', { class: 'st-tools-title' }, '駅名'),
                    this.stationSelectorElement,
                ]),
                h('div', { class: 'st-tools-container' }, [
                    h('div', { class: 'st-tools-title' }, '方向'),
                    h('label', null, [
                        this.directionSelectorElement,
                        h('div', { class: 'st-tools-direction' }, [
                            h('div', { class: 'st-tools-direction-child' }, '上り'),
                            h('div', { class: 'st-tools-direction-child' }, '下り'),
                        ]),
                    ]),
                ]),
                h('div', { class: 'st-tools-container', id: 'st-tools-direction-detail' }),
            ]),
        ]);
        this.element.append(tools, this.timetableElement);
        this.display();
    }
    finish() {
        return;
    }
    /**
     * 時刻表データを組み上げる
     * @param stationName 駅名
     * @param isInbound 上りか？
     * @param selectedIndexList 駅Indexたち
     */
    compile(stationName, isInbound = true, selectedIndexList = new Set()) {
        const indexList = this.stationList[stationName].indexList;
        const trains = isInbound ? this.inboundTrains : this.outboundTrains;
        // 駅の出現回数(合計, 分岐ごと)
        const stationCount = new Array(this.stations.length).fill(0);
        const stationCount2 = [];
        indexList.forEach((val) => stationCount2[val] = new Array(this.stations.length).fill(0));
        // 種別の出現確認
        const typeList = new Array(this.app.data.railway.trainTypes.length).fill(false);
        // これを作りたい
        const data = { stationName, trains: [], topStation: null, topStationList: new Map(), shortName: [], diagramTitle: '', direction: '', typeList: [] };
        const stationLength = this.stations.length;
        // 発車時刻や種別、行き先などを繰り返し追加していく
        trains.forEach((train, index) => {
            for (const i of indexList) {
                const stationIndex = isInbound ? stationLength - i - 1 : i;
                const terminalStationIndex = isInbound ? stationLength - train.timetable.terminalStationIndex - 1 : train.timetable.terminalStationIndex;
                if (!(stationIndex in train.timetable.data) ||
                    train.timetable.data[stationIndex].departure === null ||
                    train.timetable.data[stationIndex].stopType !== 1 ||
                    !(stationIndex + 1 in train.timetable.data))
                    continue;
                stationCount2[i][terminalStationIndex] += 1;
                if (!selectedIndexList.has(i))
                    continue;
                stationCount[terminalStationIndex] += 1;
                typeList[train.type] = true;
                data.trains.push({
                    terminalIndex: terminalStationIndex,
                    time: train.timetable.data[stationIndex].departure,
                    train,
                    trainData: {
                        direction: isInbound ? 0 : 1,
                        index,
                    },
                    trainType: train.type,
                });
                break;
            }
        });
        data.trains.sort((a, b) => a.time - b.time);
        // 最も多かった行き先を探す。
        let maxIdx = 0;
        let maxVal = 0;
        stationCount.forEach((val, i) => {
            if (maxVal < val)
                [maxVal, maxIdx] = [val, i];
        });
        data.topStation = maxIdx;
        // 最も多かった行き先を探す。分岐ごとに。
        indexList.forEach((val) => {
            maxIdx = 0;
            maxVal = 0;
            stationCount2[val].forEach((v, j) => {
                if (maxVal < v)
                    [maxVal, maxIdx] = [v, j];
            });
            if (maxVal !== 0)
                data.topStationList.set(maxIdx, val);
        });
        // 行き先の略称を作る
        let count = 1;
        const shortName = [];
        stationCount.forEach((val, i) => {
            if (val === 0 || i === maxIdx)
                return;
            // かぶりのない文字を探す
            loop1: for (const currentStationName of this.stations[i].name) {
                for (const key in shortName) {
                    if (key === currentStationName)
                        continue;
                    if (shortName.includes(currentStationName))
                        continue loop1;
                }
                shortName[i] = currentStationName;
                return;
            }
            shortName[i] = count++;
        });
        data.shortName = shortName;
        // 方向
        data.direction = this.app.data.railway.directionName[isInbound ? 0 : 1];
        data.diagramTitle = this.diagramTitle;
        // 種別
        data.typeList = typeList;
        return data;
    }
    /**
     * 画面に表示する
     * @param {boolean} changeDetail 駅名と方向以外の変更か？
     */
    display(changeDetail = false) {
        const checkboxes = document.querySelectorAll('.st-tools-direction-item>input:checked');
        const selectedIndexList = changeDetail ?
            new Set(Array.from(checkboxes).map((ele) => Number(ele.dataset.index))) :
            this.stationList[this.stationSelectorElement.value].indexList;
        const data = this.compile(this.stationSelectorElement.value, this.directionSelectorElement.checked, selectedIndexList);
        const startHour = 4;
        // 時刻のElementを時間帯別に格納する2次元配列。
        const times = new Array(24).fill(null).map(() => []);
        // 時刻ひとつひとつ
        data.trains.forEach((val) => {
            const hour = Math.floor(val.time / 3600);
            const min = Math.floor(val.time % 3600 / 60);
            times[hour].push(h('div', {
                class: 'st-train',
            }, [
                h('div', {
                    class: 'st-train-terminal',
                }, val.terminalIndex !== data.topStation ? data.shortName[val.terminalIndex] : ''),
                h('div', {
                    class: 'st-train-minute',
                    style: 'color: ' + this.app.data.railway.trainTypes[val.trainType].textColor.toHEXString(),
                }, min),
            ], () => this.app.selection = [{
                    cellType: null,
                    selectType: 'stationTimetable',
                    stationIndex: null,
                    train: val.train,
                }]));
        });
        // 1時間ずつの行
        const rows = (new Array(24)).fill(null).map((v, i) => h('div', {
            class: 'st-row',
        }, [
            h('div', {
                class: 'st-hour',
            }, (i + startHour) % 24),
            h('div', {
                class: 'st-minutes',
            }, times[(i + startHour) % 24]),
        ]));
        // 時刻表の表部分
        const wrapper = h('div', { class: 'st-wrapper' }, rows);
        // フッター
        const types = () => {
            const result = [];
            data.typeList.forEach((val, i) => {
                if (val !== true)
                    return;
                result.push(h('span', { style: 'color: ' + this.app.data.railway.trainTypes[i].textColor.toHEXString() }, this.app.data.railway.trainTypes[i].name + ' '));
            });
            return result;
        };
        let str2 = '無印…' + this.stations[data.topStation].name + '　';
        data.shortName.forEach((v, i) => {
            str2 += v + '…' + this.stations[i].name + '　';
        });
        const footer = h('div', { class: 'st-footer' }, [
            h('div', { class: 'st-footer-types' }, types()),
            h('div', { class: 'st-footer-terminals' }, str2),
        ]);
        // 画面に追加
        const sheet = h('div', {
            class: 'st-sheet',
        }, [wrapper, footer]);
        this.timetableElement.replaceWith(sheet);
        this.timetableElement = sheet;
        if (!changeDetail) {
            // 設定部分更新
            const directionContent = [];
            for (const [key, val] of data.topStationList) {
                const input = h('input', { type: 'checkbox', checked: true, class: 'st-tools-direction-checkbox' });
                input.disabled = data.topStationList.size === 1;
                input.dataset.index = String(val);
                input.addEventListener('change', () => this.display(true));
                directionContent.push(h('label', { class: 'st-tools-direction-item' }, [
                    input,
                    h('span', null, this.stations[key].name + '方面'),
                ]));
            }
            const oldDirectionDetail = document.getElementById('st-tools-direction-detail');
            const newDirectionDetail = h('div', { id: 'st-tools-direction-detail' }, directionContent);
            oldDirectionDetail.replaceWith(newDirectionDetail);
        }
    }
}
//# sourceMappingURL=StationTimetableView.js.map