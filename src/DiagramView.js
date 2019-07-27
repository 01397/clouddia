"use strict";

import { h, ouColorToHex } from "./Util.js";
import View from "./View.js";

// DiagramView.js (module)
// ダイヤグラムを表示する。斜め線いっぱいのやつ。
export default class DiagramView extends View{
  constructor(app, idx) {
    super(app);
    this.idx = idx;
    this.stations = this.app.data.Rosen[0].Eki;
    this.inboundTrains = this.app.data.Rosen[0].Dia[idx]['Nobori'][0].Ressya;
    this.outboundTrains = this.app.data.Rosen[0].Dia[idx]['Kudari'][0].Ressya;
    this.stationDistance = this.getStationDistanceArray();
    this.xScale = 3;
    this.yScale = 10;
    this.startTime = 4 * 24;
  }
  render() {
    // svgに含まれるpath要素、あと他の要素

    const lines = [];
    // 横線描画(駅)
    let y = 0;
    for (let i = 0; i < this.stations.length; i++) {
      lines.push(
        h('line', {
          x1: 0,
          x2: 4320,
          y1: y,
          y2: y,
          stroke: '#dddddd',
          strokeWidth: 0.5
        }, null, null, "http://www.w3.org/2000/svg")
      );
      y += (this.stationDistance[i] == Number.MAX_SAFE_INTEGER ? this.yScale : this.stationDistance[i] * this.yScale);
    }

    const paths = [];
    // 列車描画
    this.inboundTrains.forEach((train, i) => {
      paths.push(
        h('path', {
          d: this.getTrainPath(train.timetable),
          stroke: ouColorToHex(this.app.data.Rosen[0].Ressyasyubetsu[train.Syubetsu].DiagramSenColor)
        }, null, null, "http://www.w3.org/2000/svg")
      );
    });

    // svg要素にまとめて表示
    const svgElement = h('svg', {
      width: 4320,
      height: 1000,
      viewBox: '0 0 4320 1000'
    }, [
      h('g', { strokeWidth: 2, fill: 'none' }, paths, null, "http://www.w3.org/2000/svg"),
      ...lines
    ], null, "http://www.w3.org/2000/svg");
    document.getElementById('mainWindow').appendChild(svgElement);
  }

  getTrainPath(timetable) {
    let str = '';
    let mark = 'M';
    let y = 0;
    timetable.forEach((val, i) => {
      if (val !== null) {
        if (val.arrival !== null) {
          str += `${mark}${((val.arrival < this.startTime ? val.arrival + 24 * 60 : val.arrival) - this.startTime) * this.xScale} ${y}`;
          mark = 'L';
        }
        if (val.departure !== null) {
          str += `${mark}${((val.departure < this.startTime ? val.departure + 24 * 60 : val.departure) - this.startTime) * this.xScale} ${y}`;
          mark = 'L';
        }
        if (timetable[i + 1] && timetable[i + 1].stopType == 3) {
          mark = 'M';
        }
      }
      y += (this.stationDistance[i] == Number.MAX_SAFE_INTEGER ? this.yScale : this.stationDistance[i] * this.yScale);
    });
    return str;
  }

  // 駅間距離(描画用)
  getStationDistanceArray() {
    return this.getMinimumRunTime();
  }
  // 駅間の最小所要時間
  getMinimumRunTime() {
    const len = this.stations.length;
    const result = new Array(len - 1).fill(Number.MAX_SAFE_INTEGER);
    const f = (trains, isInbound) => {
      trains.forEach(train => {
        let prevDep = null;
        train.timetable.forEach((val, i) => {
          if (val === null || (val.arrival === null && val.departure === null)) {
            prevDep = null;
            return;
          }
          if (prevDep != null) {
            let delta = (val.arrival || val.departure) - prevDep;
            if (delta < 0) delta += 24 * 60;
            result[isInbound ? len - i - 1 : i - 1] = Math.min(result[isInbound ? len - i - 1 : i - 1], delta);
          }
          prevDep = val.departure;
        });
      });
    };
    f(this.inboundTrains, true);
    f(this.outboundTrains, false);
    return result;
  }
  finish() { }
}


