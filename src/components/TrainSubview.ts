import App from '../App.js';
import { createMultilineTextField, createTextField, createTimeField, h, numberToTimeString, timeStringCheck, timeStringToNumber } from '../Util.js';
import Subview from './Subview.js';
import TrainTimetableView from './TrainTimetableView.js';
import { Train } from '../DiagramParser.js';
import StationTimetableView from './StationTimetableView.js';

export default class TrainSubview extends Subview {
  private _tabId: number;
  private content: Element;
  private cellInfo: { stationIndex: number; direction: number; train: Train };
  constructor(app: App, tabId: number) {
    super(app);
    this.cellInfo = null;
    this.tabId = tabId;
  }
  set tabId(tabId: number) {
    if (this._tabId === tabId) return;
    this._tabId = tabId;
    this.update();
  }
  get tabId() {
    return this._tabId;
  }
  public finish() {
    return;
  }
  public showStationTime(cellInfo: { stationIndex: number; direction: number; train: Train } = null) {
    this.cellInfo = cellInfo;
    this.update();
  }

  public update() {
    let content;
    if (this.cellInfo == null) {
      content = 'セルが選択されていません';
      this.element.innerHTML = '';
      this.element.append(content);
    } else {
      const tabList = [];
      if (this.cellInfo.stationIndex !== null) {
        tabList.push(
          h('div', { class: 'sub-tab-item' + (this.tabId === 0 ? ' selected' : '') }, '駅', () => {
            this.tabId = 0;
          })
        );
      } else {
        this._tabId = 1;
      }
      tabList.push(
        h('div', { class: 'sub-tab-item' + (this.tabId === 1 ? ' selected' : '') }, '列車', () => {
          this.tabId = 1;
        })
      );
      // tabList.push(h('div', { class: 'sub-tab-item' + (this.tabId === 2 ? ' selected' : '') }, '運用', () => { this.tabId = 2 }));
      const tab = h('div', { class: 'sub-tab-container' }, tabList);
      if (this.tabId === 0) {
        // 液タブ ...じゃなかった、駅タブ
        const stationIndex =
          this.cellInfo.train.direction === 0 ? this.cellInfo.stationIndex : this.app.data.railway.stations.length - this.cellInfo.stationIndex - 1;
        const station = this.app.data.railway.stations[this.cellInfo.stationIndex];
        const stationName = station.name;
        const ttd = this.cellInfo.train.timetable.data[stationIndex];
        const stopType = ttd ? ttd.stopType - 1 : 2;

        // 駅扱い
        const buttonsetChange = (e: Event) => {
          const value = Number((e.currentTarget as HTMLInputElement).value);
          if (value === 2) {
            delete this.cellInfo.train.timetable.data[stationIndex];
            (this.element.querySelector('.ts-arrival') as HTMLInputElement).value = '';
            (this.element.querySelector('.ts-delta') as HTMLInputElement).value = '';
            (this.element.querySelector('.ts-departure') as HTMLInputElement).value = '';
          } else if (ttd) {
            ttd.stopType = value + 1;
          } else {
            this.cellInfo.train.timetable.data[stationIndex] = {
              arrival: null,
              departure: null,
              stopType: value + 1,
              track: null,
            };
          }
          this.cellInfo.train.timetable.update();
          this.updateMainView();
        };
        const radio = new Array(3).fill(0).map((v, i) => {
          const radioAttr =
            stopType === i
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
        const trackSelector = h('select', { class: 'form-selector ts-track' }, trackOptions) as HTMLSelectElement;
        if (ttd) trackSelector.value = String(ttd.track);
        trackSelector.addEventListener('change', e => {
          if (!ttd) return;
          ttd.track = Number((e.currentTarget as HTMLSelectElement).value);
        });

        const arrival = stopType !== 2 && ttd.arrival !== null ? numberToTimeString(ttd.arrival, 'HH MM SS') : '';
        const departure = stopType !== 2 && ttd.departure !== null ? numberToTimeString(ttd.departure, 'HH MM SS') : '';
        const delta =
          stopType !== 2 && ttd.arrival !== null && ttd.departure !== null ? numberToTimeString(ttd.departure - ttd.arrival, 'HH MM SS') : '';
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
      } else if (this.tabId === 1) {
        // 列車タブ
        const trainTypeList = this.app.data.railway.trainTypes;
        const trainTypeOptions = trainTypeList.map((trainType, i) => h('option', { value: i }, trainType.name));
        const trainTypeSelector = h('select', { class: 'form-selector' }, trainTypeOptions) as HTMLSelectElement;
        trainTypeSelector.value = String(this.cellInfo.train.type);
        trainTypeSelector.style.color = trainTypeList[this.cellInfo.train.type].textColor.toHEXString();
        trainTypeSelector.addEventListener('change', e => {
          this.cellInfo.train.type = Number((e.currentTarget as HTMLSelectElement).value);
          trainTypeSelector.style.color = trainTypeList[this.cellInfo.train.type].textColor.toHEXString();
          this.updateMainView();
        });
        content = [
          h('div', { class: 'sub-section' }, [
            h('div', { class: 'sub-header' }, '列車'),
            h('div', { class: 'sub-list-container' }, [
              h('div', { class: 'form-row' }, [h('div', { class: 'form-label' }, '種別'), trainTypeSelector]),
              h('div', { class: 'form-row' }, [
                h('div', { class: 'form-label' }, '列車番号'),
                createTextField(this.cellInfo.train.number, '', '', e => {
                  this.cellInfo.train.number = (e.currentTarget as HTMLInputElement).value;
                  this.updateMainView();
                }),
              ]),
              h('div', { class: 'form-row' }, [
                h('div', { class: 'form-label' }, '列車名'),
                createTextField(this.cellInfo.train.name, '', 'ts-name', e => {
                  this.cellInfo.train.name = (e.currentTarget as HTMLInputElement).value;
                  this.updateMainView();
                }),
                createTextField(this.cellInfo.train.count, '', 'ts-count', e => {
                  this.cellInfo.train.count = (e.currentTarget as HTMLInputElement).value;
                  this.updateMainView();
                }),
                h('div', { class: 'ts-count-text' }, '号'),
              ]),
              h('div', { class: 'form-row' }, [
                h('div', { class: 'form-label' }, '備考'),
                createMultilineTextField(this.cellInfo.train.note, '', '', e => {
                  this.cellInfo.train.note = (e.currentTarget as HTMLTextAreaElement).value;
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
  private updateTime(type: string) {
    const arrival = this.element.querySelector('.ts-arrival') as HTMLInputElement;
    const departure = this.element.querySelector('.ts-departure') as HTMLInputElement;
    const delta = this.element.querySelector('.ts-delta') as HTMLInputElement;
    const stationIndex =
      this.cellInfo.train.direction === 0 ? this.cellInfo.stationIndex : this.app.data.railway.stations.length - this.cellInfo.stationIndex - 1;
    if (!this.cellInfo.train.timetable.data[stationIndex]) {
      if (arrival.value === '' && departure.value === '') return;
      this.cellInfo.train.timetable.data[stationIndex] = {
        stopType: 1,
        arrival: null,
        departure: null,
        track: 1,
      };
      (document.querySelector('input.form-buttonset-radio') as HTMLInputElement).checked = true;
    }
    const ttd = this.cellInfo.train.timetable.data[stationIndex];
    if (type === 'arrival') {
      if (arrival.value === '') {
        ttd.arrival = null;
      } else if (timeStringCheck(arrival.value)) {
        ttd.arrival = timeStringToNumber(arrival.value);
      }
    } else if (type === 'departure') {
      if (departure.value === '') {
        ttd.departure = null;
      } else if (timeStringCheck(departure.value)) {
        ttd.departure = timeStringToNumber(departure.value);
      }
    } else if (type === 'delta') {
      if (ttd.arrival !== null) {
        ttd.departure = timeStringToNumber(arrival.value) + timeStringToNumber(delta.value);
      } else if (ttd.arrival !== null) {
        ttd.arrival = timeStringToNumber(departure.value) - timeStringToNumber(delta.value);
      }
    }
    arrival.value = ttd.arrival !== null ? numberToTimeString(ttd.arrival, 'HH MM SS') : '';
    departure.value = ttd.departure !== null ? numberToTimeString(ttd.departure, 'HH MM SS') : '';
    delta.value = ttd.arrival !== null && ttd.departure !== null ? numberToTimeString(ttd.departure - ttd.arrival, 'HH MM SS') : '';
    this.updateMainView();
    this.cellInfo.train.timetable.update();
  }
  public focusField(type: string) {
    let field = null;
    this.tabId = 0;
    switch (type) {
      case 'arrival':
        field = this.element.querySelector('.ts-arrival') as HTMLInputElement;
        break;
      case 'departure':
        field = this.element.querySelector('.ts-departure') as HTMLInputElement;
        break;
      default:
        return;
    }
    field.focus();
  }
  private updateMainView() {
    if (this.app.main instanceof TrainTimetableView) {
      this.app.main.update();
    } else if (this.app.main instanceof StationTimetableView) {
      this.app.main.display(true);
    }
  }
}
