"use strict";

import View from "./View.js";
import { h, ouColorToHex } from "./Util.js";

export default class StationTimetableView extends View {
  constructor(app, idx) {
    super(app);
    // 何番目のダイヤか
    this.idx = idx;
    // 使用するデータたち
    this.stations = this.app.data.Rosen[0].Eki;
    this.diagramTitle = this.app.data.Rosen[0].Dia[idx].DiaName;
    this.inboundTrains = this.app.data.Rosen[0].Dia[idx]['Nobori'][0].Ressya;
    this.outboundTrains = this.app.data.Rosen[0].Dia[idx]['Kudari'][0].Ressya;
    // 同一名称の駅を集めて、分岐に対応する。
    this.stationList = {};
    this.stations.forEach((station, idx) => {
      const key = station.Ekimei;
      if (!(key in this.stationList)) {
        this.stationList[key] = {
          indexList: new Set([idx])
        };
      } else {
        this.stationList[key].indexList.add(idx);
      }
    });

  }
  // 画面上に表示された時の1回呼ばれる。駅の一覧を出力する。
  render() {
    this.window = document.getElementById('mainWindow');

    // メインの時刻表部分
    this.timetableSheet = h('div');

    // 駅名のプルダウン
    const stationElements = [];
    for (const key in this.stationList) {
      stationElements.push(
        h('option', { value: key }, key)
      );
    }
    this.stationSelector = h('select', { id: 'stationSelector' }, stationElements);
    this.stationSelector.addEventListener('change', () => this.display(), false);

    // 上り or 下り
    this.directionSelector = h('input', { id: 'directionSelector', type: 'checkbox' });
    this.directionSelector.addEventListener('change', () => this.display(), false);

    const tools = h('div', { id: 'st-tools-wrapper' }, [
      h('div', { id: 'st-tools' }, [
        h('div', {class: 'st-tools-container'}, [
          h('div', { class: "st-tools-title" }, '駅名'),
          this.stationSelector
        ]),
        h('div', {class: 'st-tools-container'}, [
          h('div', { class: "st-tools-title" }, '方向'),
          h('label', null, [
            this.directionSelector,
            h('div', { class: "st-tools-direction" }, [
              h('div', { class: "st-tools-direction-child" }, '上り'),
              h('div', { class: "st-tools-direction-child" }, '下り')
            ])
          ]),
        ]),
        h('div', {class: 'st-tools-container', id: "st-tools-direction-detail" })
      ])
    ]);
    this.window.append(tools, this.timetableSheet);

    this.display();
  }
  // 時刻表データを組み上げる
  compile(stationName, isInbound = true, selectedIndexList = new Set()) {
    const indexList = this.stationList[stationName].indexList;
    const trains = isInbound ? this.inboundTrains : this.outboundTrains;
    // 駅の出現回数(合計, 分岐ごと)
    const stationCount = new Array(this.stations.length).fill(0);
    const stationCount2 = [];
    indexList.forEach(val => stationCount2[val] = new Array(this.stations.length).fill(0));
    // 種別の出現確認
    const typeList = new Array(this.app.data.Rosen[0].Ressyasyubetsu.length).fill(false);
    // これを作りたい
    const data = { stationName, trains: [], topStation: null, topStationList: new Map() };

    // 発車時刻や種別、行き先などを繰り返し追加していく
    trains.forEach((train, index) => {
      for (const i of indexList) {
        const idx = isInbound ? this.stations.length - i - 1 : i;
        if (train.timetable[idx] === null || train.timetable[idx].stopType !== 1 || train.timetable[idx].departure === null || (train.timetable[idx + 1] && train.timetable[idx + 1].stopType === 3)) continue;
        stationCount2[i][train.terminalIndex] += 1;
        if (!selectedIndexList.has(i)) continue;
        stationCount[train.terminalIndex] += 1;
        typeList[train.Syubetsu] = true;
        data.trains.push({
          trainType: train.Syubetsu,
          terminalIndex: train.terminalIndex,
          time: train.timetable[idx].departure,
          trainData: {
            diaIndex: this.idx,
            index,
            direction: isInbound ? 'inbound': 'outbound'
          }
        });
        break;
      }
    });
    data.trains.sort((a, b) => a.time - b.time);

    // 最も多かった行き先を探す。
    let maxIdx = 0, maxVal = 0;
    stationCount.forEach((val, i) => {
      if (maxVal < val) [maxVal, maxIdx] = [val, i];
    });
    data.topStation = maxIdx;
    // 最も多かった行き先を探す。分岐ごとに。
    indexList.forEach((val, i) => {
      let maxIdx = 0, maxVal = 0;
      stationCount2[val].forEach((val, i) => {
        if (maxVal < val) [maxVal, maxIdx] = [val, i];
      });
      if(maxVal !== 0)data.topStationList.set(maxIdx, val);
    });


    // 行き先の略称を作る
    let count = 1;
    const shortName = [];
    stationCount.forEach((val, i) => {
      if (val == 0 || i == maxIdx) return;
      const stationName = this.stations[i].Ekimei;
      // かぶりのない文字を探す
      loop1: for (let s = 0; s < stationName.length; s++) {
        for (const key in shortName) {
          if (key == stationName) continue;
          if (shortName.includes(stationName[s])) continue loop1;
        }
        shortName[i] = stationName[s];
        return;
      }
      shortName[i] = count++;
    });
    data.shortName = shortName;

    // 方向
    data.direction = isInbound ? '上り' : '下り';
    data.diagramTitle = this.diagramTitle;

    // 種別
    data.typeList = typeList;

    return data;
  }

  // 表示処理
  // 駅名, 上り下り 以外の切り替えならchangeSetting == true
  display(changeDetail = false) {
    const checkboxes = document.querySelectorAll('.st-tools-direction-item>input:checked');
    const selectedIndexList = changeDetail ? new Set(Array.from(checkboxes).map(ele => Number(ele.dataset.index))) : this.stationList[this.stationSelector.value].indexList;
    const data = this.compile(this.stationSelector.value, this.directionSelector.checked, selectedIndexList);

    const startHour = 4;
    // 時刻のElementを時間帯別に格納する2次元配列。
    const times = new Array(24).fill(null).map(() => []);

    // 時刻ひとつひとつ
    data.trains.forEach(val => {
      const hour = Math.floor(val.time / 60);
      const min = val.time % 60;
      times[hour].push(
        h('div', {
          class: 'st-train'
        }, [
            h('div', {
              class: 'st-train-terminal',
            }, val.terminalIndex !== data.topStation ? data.shortName[val.terminalIndex] : ''),
            h('div', {
              class: 'st-train-minute',
              style: 'color: ' + ouColorToHex(this.app.data.Rosen[0].Ressyasyubetsu[val.trainType].JikokuhyouMojiColor)
            }, min)
          ],
          () => this.app.infoPanel.showTrain(val.trainData)
        )
      );
    });
    // 1時間ずつの行
    const rows = (new Array(24)).fill(null).map((v, i) =>
      h('div', {
        class: 'st-row'
      }, [
          h('div', {
            class: 'st-hour'
          }, (i + startHour) % 24),
          h('div', {
            class: 'st-minutes'
          }, times[(i + startHour) % 24])
        ])
    );
    // 時刻表の表部分
    const wrapper = h('div', { class: 'st-wrapper' }, rows);

    // フッター
    const types = () => {
      const result = [];
      data.typeList.forEach((val, i) => {
        if (val !== true) return;
        result.push(h('span', { style: 'color: ' + ouColorToHex(this.app.data.Rosen[0].Ressyasyubetsu[i].JikokuhyouMojiColor) }, this.app.data.Rosen[0].Ressyasyubetsu[i].Syubetsumei + ' '));
      });
      return result;
    };
    let str2 = '無印…' + this.stations[data.topStation].Ekimei + '　';
    data.shortName.forEach((v, i) => {
      str2 += v + '…' + this.stations[i].Ekimei + '　';
    });

    const footer = h('div', { class: 'st-footer' }, [
      h('div', { class: 'st-footer-types' }, types()),
      h('div', { class: 'st-footer-terminals' }, str2)
    ]);


    // 画面に追加
    const sheet = h('div', {
      class: 'st-sheet'
    }, [wrapper, footer]);
    this.timetableSheet.replaceWith(sheet);
    this.timetableSheet = sheet;

    if (!changeDetail) {
      // 設定部分更新
      let directionContent = [];
      for (const [key, val] of data.topStationList) {
        const input = h('input', { type: 'checkbox', checked: true, class: 'st-tools-direction-checkbox' });
        input.disabled = data.topStationList.size === 1;
        input.dataset.index = val;
        input.addEventListener('change', () => this.display(true));
        directionContent.push(
          h('label', { class: 'st-tools-direction-item' }, [
            input,
            h('span', null, this.stations[key].Ekimei + '方面')
          ])
        );
      }
      const oldDirectionDetail = document.getElementById("st-tools-direction-detail");
      const newDirectionDetail = h('div', { id: "st-tools-direction-detail" }, directionContent);
      oldDirectionDetail.replaceWith(newDirectionDetail);
    }
  }


}