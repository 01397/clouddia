import { createMultilineTextField, createTextField, createTimeField, h, numberToTimeString, timeStringCheck, timeStringToNumber, } from '../Util.js';
import Subview from './Subview.js';
import TrainTimetableView from './TrainTimetableView.js';
import StationTimetableView from './StationTimetableView.js';
export default class TrainSubview extends Subview {
    constructor(app, tabId) {
        super(app);
        this.selectedTrain = null;
        this.tabId = tabId;
    }
    set tabId(tabId) {
        if (this._tabId === tabId)
            return;
        this._tabId = tabId;
        this.update();
    }
    get tabId() {
        return this._tabId;
    }
    finish() {
        return;
    }
    showStationTime(selectedTrain = null) {
        this.selectedTrain = selectedTrain;
        this.update();
    }
    update() {
        let content;
        if (this.selectedTrain == null) {
            content = 'セルが選択されていません';
            this.element.innerHTML = '';
            this.element.append(content);
        }
        else {
            const tabList = [];
            if (this.selectedTrain.stationIndex !== null) {
                tabList.push(h('div', { class: 'sub-tab-item' + (this.tabId === 0 ? ' selected' : '') }, '駅', () => {
                    this.tabId = 0;
                }));
            }
            else {
                this._tabId = 1;
            }
            tabList.push(h('div', { class: 'sub-tab-item' + (this.tabId === 1 ? ' selected' : '') }, '列車', () => {
                this.tabId = 1;
            }));
            // tabList.push(h('div', { class: 'sub-tab-item' + (this.tabId === 2 ? ' selected' : '') }, '運用', () => { this.tabId = 2 }));
            const tab = h('div', { class: 'sub-tab-container' }, tabList);
            if (this.tabId === 0) {
                // 液タブ ...じゃなかった、駅タブ
                const stationIndex = this.selectedTrain.train.direction === 0
                    ? this.selectedTrain.stationIndex
                    : this.app.data.railway.stations.length - this.selectedTrain.stationIndex - 1;
                const station = this.app.data.railway.stations[this.selectedTrain.stationIndex];
                const stationName = station.name;
                const ttd = this.selectedTrain.train.timetable.data[stationIndex];
                const stopType = ttd ? ttd.stopType - 1 : 2;
                // 駅扱い
                const buttonsetChange = (e) => {
                    const value = Number(e.currentTarget.value);
                    if (!this.selectedTrain)
                        return;
                    if (value === 2) {
                        delete this.selectedTrain.train.timetable.data[stationIndex];
                        this.element.querySelector('.ts-arrival').value = '';
                        this.element.querySelector('.ts-delta').value = '';
                        this.element.querySelector('.ts-departure').value = '';
                    }
                    else if (ttd) {
                        ttd.stopType = value + 1;
                    }
                    else {
                        this.selectedTrain.train.timetable.data[stationIndex] = {
                            arrival: null,
                            departure: null,
                            stopType: value + 1,
                            track: null,
                        };
                    }
                    this.selectedTrain.train.timetable.update();
                    this.updateMainView();
                };
                const radio = new Array(3).fill(0).map((v, i) => {
                    const radioAttr = stopType === i
                        ? {
                            class: 'form-buttonset-radio',
                            type: 'radio',
                            value: i,
                            name: 'sub-stationType',
                            checked: 'checked',
                        }
                        : {
                            class: 'form-buttonset-radio',
                            type: 'radio',
                            value: i,
                            name: 'sub-stationType',
                        };
                    const input = h('input', radioAttr);
                    input.addEventListener('change', buttonsetChange);
                    return input;
                });
                const buttonset = h('div', { class: 'form-buttonset' }, [
                    h('label', null, [
                        radio[0],
                        h('div', { class: 'form-buttonset-item' }, [
                            h('div', { class: 'form-buttonset-mark' }, '○'),
                            h('div', { class: 'form-buttonset-label' }, '停車'),
                        ]),
                    ]),
                    h('label', null, [
                        radio[1],
                        h('div', { class: 'form-buttonset-item' }, [
                            h('div', { class: 'form-buttonset-mark' }, 'ﾚ'),
                            h('div', { class: 'form-buttonset-label' }, '通過'),
                        ]),
                    ]),
                    h('label', null, [
                        radio[2],
                        h('div', { class: 'form-buttonset-item' }, [
                            h('div', { class: 'form-buttonset-mark' }, '‥'),
                            h('div', { class: 'form-buttonset-label' }, 'なし'),
                        ]),
                    ]),
                ]);
                // 番線
                const trackOptions = station.tracks.map((stationTrack, i) => h('option', { value: i }, stationTrack.name));
                const trackSelector = h('select', { class: 'form-selector ts-track' }, trackOptions);
                if (ttd)
                    trackSelector.value = String(ttd.track);
                trackSelector.addEventListener('change', e => {
                    if (!ttd)
                        return;
                    ttd.track = Number(e.currentTarget.value);
                });
                const arrival = stopType !== 2 && ttd.arrival !== null ? numberToTimeString(ttd.arrival, 'HH MM SS') : '';
                const departure = stopType !== 2 && ttd.departure !== null ? numberToTimeString(ttd.departure, 'HH MM SS') : '';
                const delta = stopType !== 2 && ttd.arrival !== null && ttd.departure !== null
                    ? numberToTimeString(ttd.departure - ttd.arrival, 'HH MM SS')
                    : '';
                content = [
                    h('div', { class: 'sub-section' }, [
                        h('div', { class: 'sub-header' }, stationName),
                        h('div', { class: 'sub-list-container' }, [
                            h('div', { class: 'form-row' }, [h('div', { class: 'form-label' }, '駅扱い'), buttonset]),
                            h('div', { class: 'form-row' }, [h('div', { class: 'form-label' }, '発着番線'), trackSelector]),
                            h('div', { class: 'form-row sub-stationTime-container' }, [
                                h('div', { class: 'sub-stationTime-left' }, [
                                    h('div', { class: 'form-row' }, [
                                        h('div', { class: 'form-label' }, '到着時刻'),
                                        createTimeField(arrival, 'ts-arrival no-margin', () => {
                                            this.updateTime('arrival');
                                        }),
                                    ]),
                                    h('div', { class: 'form-row' }, [
                                        h('div', { class: 'form-label' }, '発車時刻'),
                                        createTimeField(departure, 'ts-departure', () => {
                                            this.updateTime('departure');
                                        }),
                                    ]),
                                ]),
                                h('div', { class: 'sub-stationTime-center' }),
                                createTimeField(delta, 'ts-delta', () => {
                                    this.updateTime('delta');
                                }),
                            ]),
                        ]),
                    ]),
                ];
            }
            else if (this.tabId === 1) {
                // 列車タブ
                const trainTypeList = this.app.data.railway.trainTypes;
                const trainTypeOptions = trainTypeList.map((trainType, i) => h('option', { value: i }, trainType.name));
                const trainTypeSelector = h('select', { class: 'form-selector' }, trainTypeOptions);
                trainTypeSelector.value = String(this.selectedTrain.train.type);
                trainTypeSelector.style.color = trainTypeList[this.selectedTrain.train.type].textColor.toHEXString();
                trainTypeSelector.addEventListener('change', e => {
                    if (!this.selectedTrain)
                        return;
                    this.selectedTrain.train.type = Number(e.currentTarget.value);
                    trainTypeSelector.style.color = trainTypeList[this.selectedTrain.train.type].textColor.toHEXString();
                    this.updateMainView();
                });
                content = [
                    h('div', { class: 'sub-section' }, [
                        h('div', { class: 'sub-header' }, '列車'),
                        h('div', { class: 'sub-list-container' }, [
                            h('div', { class: 'form-row' }, [h('div', { class: 'form-label' }, '種別'), trainTypeSelector]),
                            h('div', { class: 'form-row' }, [
                                h('div', { class: 'form-label' }, '列車番号'),
                                createTextField(this.selectedTrain.train.number, '', '', e => {
                                    if (!this.selectedTrain)
                                        return;
                                    this.selectedTrain.train.number = e.currentTarget.value;
                                    this.updateMainView();
                                }),
                            ]),
                            h('div', { class: 'form-row' }, [
                                h('div', { class: 'form-label' }, '列車名'),
                                createTextField(this.selectedTrain.train.name, '', 'ts-name', e => {
                                    if (!this.selectedTrain)
                                        return;
                                    this.selectedTrain.train.name = e.currentTarget.value;
                                    this.updateMainView();
                                }),
                                createTextField(this.selectedTrain.train.count, '', 'ts-count', e => {
                                    if (!this.selectedTrain)
                                        return;
                                    this.selectedTrain.train.count = e.currentTarget.value;
                                    this.updateMainView();
                                }),
                                h('div', { class: 'ts-count-text' }, '号'),
                            ]),
                            h('div', { class: 'form-row' }, [
                                h('div', { class: 'form-label' }, '備考'),
                                createMultilineTextField(this.selectedTrain.train.note, '', '', e => {
                                    if (!this.selectedTrain)
                                        return;
                                    this.selectedTrain.train.note = e.currentTarget.value;
                                    this.updateMainView();
                                }),
                            ]),
                        ]),
                    ]),
                ];
            }
            this.content = h('div', { class: 'sub-content' }, content);
            this.element.innerHTML = '';
            this.element.append(tab, this.content);
        }
    }
    updateTime(type) {
        if (!this.selectedTrain)
            return;
        const arrival = this.element.querySelector('.ts-arrival');
        const departure = this.element.querySelector('.ts-departure');
        const delta = this.element.querySelector('.ts-delta');
        const stationIndex = this.selectedTrain.train.direction === 0
            ? this.selectedTrain.stationIndex
            : this.app.data.railway.stations.length - this.selectedTrain.stationIndex - 1;
        if (!this.selectedTrain.train.timetable.data[stationIndex]) {
            if (arrival.value === '' && departure.value === '')
                return;
            this.selectedTrain.train.timetable.data[stationIndex] = {
                stopType: 1,
                arrival: null,
                departure: null,
                track: 1,
            };
            document.querySelector('input.form-buttonset-radio').checked = true;
        }
        const ttd = this.selectedTrain.train.timetable.data[stationIndex];
        if (type === 'arrival') {
            if (arrival.value === '') {
                ttd.arrival = null;
            }
            else if (timeStringCheck(arrival.value)) {
                ttd.arrival = timeStringToNumber(arrival.value);
            }
        }
        else if (type === 'departure') {
            if (departure.value === '') {
                ttd.departure = null;
            }
            else if (timeStringCheck(departure.value)) {
                ttd.departure = timeStringToNumber(departure.value);
            }
        }
        else if (type === 'delta') {
            if (ttd.arrival !== null) {
                ttd.departure = timeStringToNumber(arrival.value) + timeStringToNumber(delta.value);
            }
            else if (ttd.arrival !== null) {
                ttd.arrival = timeStringToNumber(departure.value) - timeStringToNumber(delta.value);
            }
        }
        arrival.value = ttd.arrival !== null ? numberToTimeString(ttd.arrival, 'HH MM SS') : '';
        departure.value = ttd.departure !== null ? numberToTimeString(ttd.departure, 'HH MM SS') : '';
        delta.value =
            ttd.arrival !== null && ttd.departure !== null ? numberToTimeString(ttd.departure - ttd.arrival, 'HH MM SS') : '';
        this.updateMainView();
        this.selectedTrain.train.timetable.update();
    }
    focusField(type) {
        let field;
        this.tabId = 0;
        switch (type) {
            case 'arrival':
                field = this.element.querySelector('.ts-arrival');
                break;
            case 'departure':
                field = this.element.querySelector('.ts-departure');
                break;
            default:
                return;
        }
        field.focus();
    }
    updateMainView() {
        if (this.app.main instanceof TrainTimetableView) {
            this.app.main.update();
        }
        else if (this.app.main instanceof StationTimetableView) {
            this.app.main.display(true);
        }
    }
}
//# sourceMappingURL=TrainSubview.js.map