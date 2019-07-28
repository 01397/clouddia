"use strict";

import { h, ouColorToHex, MinutesToHHMM } from "./Util.js";
import View from "./View.js";

// DiagramView.js (module)
// ダイヤグラムを表示する。斜め線いっぱいのやつ。
export default class DiagramView extends View {
  constructor(app, idx) {
    super(app);
    this.idx = idx;
    this.stations = this.app.data.Rosen[0].Eki;
    this.inboundTrains = this.app.data.Rosen[0].Dia[idx]['Nobori'][0].Ressya;
    this.outboundTrains = this.app.data.Rosen[0].Dia[idx]['Kudari'][0].Ressya;
    this.stationDistance = this.getStationDistanceArray();
    this.xScale = 7;
    this.yScale = 10;
    this.visibleInbound = true;
    this.visibleOutbound = true;
    // 1日の始まりは4時から。
    this.startTime = 4 * 60;
  }
  render() {
    this.window = document.getElementById('mainWindow');

    // 左部(駅名)
    let stationContainer = document.createElement('div');
    stationContainer.id = "diagram-station";
    this.stationContainer = stationContainer;
    this.window.appendChild(stationContainer);

    // 上部(時刻)
    let timeContainer = document.createElement('div');
    timeContainer.id = "diagram-time";
    this.timeContainer = timeContainer;
    this.window.appendChild(timeContainer);

    // 右下(ボタン群)
    let toolContainer = document.createElement('div');
    toolContainer.id = 'diagram-tools';
    toolContainer.innerHTML = `
    <div id="diagram-tools-container1" class="diagram-tools-container">
      <div id="diagram-tools-zoomin" class="diagram-tools-button"></div>
      <div id="diagram-tools-zoomout" class="diagram-tools-button"></div>
    </div>
    <div id="diagram-tools-container3" class="diagram-tools-container">
      <div id="diagram-tools-outbound" class="diagram-tools-button"></div>
      <div id="diagram-tools-inbound" class="diagram-tools-button"></div>
      <div id="diagram-tools-narrow" class="diagram-tools-button"></div>
      <div id="diagram-tools-widen" class="diagram-tools-button"></div>
    </div>
    </div>`;
    this.window.appendChild(toolContainer);

    this.svgElement = h('svg', { id: 'diagram-svg' }, null, null, "http://www.w3.org/2000/svg");
    this.window.appendChild(this.svgElement);

    document.getElementById('diagram-tools-outbound').addEventListener('click', () => { this.visibleOutbound = !this.visibleOutbound; this.draw();}, false);
    document.getElementById('diagram-tools-inbound').addEventListener('click', () => { this.visibleInbound = !this.visibleInbound; this.draw();}, false);
    document.getElementById('diagram-tools-widen').addEventListener('click', () => this.scale(this.xScale * 1.2), false);
    document.getElementById('diagram-tools-narrow').addEventListener('click', () => this.scale(this.xScale / 1.2), false);
    document.getElementById('diagram-tools-zoomin').addEventListener('click', () => this.scale(this.xScale * 1.2, this.yScale * 1.2), false);
    document.getElementById('diagram-tools-zoomout').addEventListener('click', () => this.scale(this.xScale / 1.2, this.yScale / 1.2), false);

    this.draw();
  }
  // 表示サイズの変更
  scale(newXScale = this.xScale, newYScale = this.yScale) {
    // mainWindowのサイズの半分
    const halfScreenWidth = this.window.offsetWidth / 2;
    const halfScreenHeight = this.window.offsetHeight / 2;
    // 伸縮比率
    const xRatio = newXScale / this.xScale;
    const yRatio = newYScale / this.yScale;
    // スケーリング前のmainWindowのスクロール位置
    const scrollLeft = this.window.scrollLeft;
    const scrollTop = this.window.scrollTop;
    // スケーリング後のmainWindowのスクロール位置
    const newX = Math.max(0, (scrollLeft + halfScreenWidth) * xRatio - halfScreenWidth);
    const newY = Math.max(0, (scrollTop + halfScreenHeight) * yRatio - halfScreenHeight);
    // 拡大比率更新
    this.xScale = newXScale;
    this.yScale = newYScale;
    // CSSでアニメーションをする
    this.svgElement.style.transition = this.stationContainer.style.transition = this.timeContainer.style.transition = 'transform 0.19s ease 0s';
    this.svgElement.style.transform = `translate(${scrollLeft - newX}px, ${scrollTop - newY}px) scale(${xRatio}, ${yRatio})`;
    this.timeContainer.style.transform = `translate(${scrollLeft - newX}px, 0) scale(${xRatio}, 1)`;
    this.stationContainer.style.transform = `translate(0, ${scrollTop - newY}px) scale(1, ${yRatio})`;

    const drawFunc = this.draw(false);
    setTimeout(() =>
      requestAnimationFrame(() => {
        // CSSを元に戻す
        this.svgElement.style.transition = this.timeContainer.style.transition = this.stationContainer.style.transition = 'none';
        this.svgElement.style.transform = this.timeContainer.style.transform = this.stationContainer.style.transform = `scale(1, 1) translate(0, 0)`;
        // JSで描画
        drawFunc();
        // 位置合わせ
        this.window.scrollLeft = newX;
        this.window.scrollTop = newY;
      })
      , 200);


  }
  // 全体の描画
  draw(immediate = true) {
    // line要素を集める
    const lines = [];
    const timeLabels = [];
    const stationLabels = [];


    // 駅、横線描画
    // y座標
    let y = 8;
    for (let i = 0; i <= this.stationDistance.length; i++) {
      lines.push(
        h('line', {
          x1: 0,
          x2: 60 * 24 * this.xScale,
          y1: y,
          y2: y,
          stroke: '#dddddd',
          strokeWidth: 0.5
        }, null, null, "http://www.w3.org/2000/svg")
      );
      const label = h('div', { class: 'diagram-label' }, this.stations[i].Ekimei);
      label.style.top = (y + 3) + 'px';
      stationLabels.push(label);
      if (i >= this.stationDistance.length) continue;
      y += (this.stationDistance[i] == Number.MAX_SAFE_INTEGER ? this.yScale : this.stationDistance[i] * this.yScale);
    }
    // この先、yはSVG全体の高さとして用いる
    y += 8;

    // 時刻、縦線描画
    // d1: ラベル間隔, d2: 中目盛, d3: 小目盛
    let d1, d2, d3;
    if (this.xScale > 15) {
      [d1, d2, d3] = [5, 5, 1];
    } else if (this.xScale > 5) {
      [d1, d2, d3] = [10, 5, 1];
    } else if (this.xScale > 4) {
      [d1, d2, d3] = [20, 10, 2];
    } else if (this.xScale > 2) {
      [d1, d2, d3] = [30, 10, 2];
    } else {
      [d1, d2, d3] = [60, 10, 5];
    }
    for (let i = 0; i < 24 * 60; i += d3) {
      const x = i * this.xScale;
      const t = i + this.startTime;
      if (t % d1 === 0) {
        const label = h('div', { class: 'diagram-label' }, MinutesToHHMM(t, ':'));
        label.style.left = (x + 80 - 20) + 'px';//20というのはlabelの幅の半分。中央寄せのための調整
        timeLabels.push(label);
      }
      lines.push(
        h('line', {
          x1: x,
          x2: x,
          y1: 0,
          y2: y,
          stroke: t % d1 === 0 ? '#b0b0b0' : '#d0d0d0',
          'stroke-dasharray': t % d2 === 0 ? '0' : '3 1.5'
        }, null, null, "http://www.w3.org/2000/svg")
      );
    }

    const paths = [];
    // 列車描画
    if (this.visibleOutbound) {
      this.outboundTrains.forEach(train => {
        paths.push(
          h('path', {
            d: this.getTrainPath(train.timetable),
            stroke: ouColorToHex(this.app.data.Rosen[0].Ressyasyubetsu[train.Syubetsu].DiagramSenColor)
          }, null, null, "http://www.w3.org/2000/svg")
        );
      });
    }
    if (this.visibleInbound) {
      this.inboundTrains.forEach(train => {
        paths.push(
          h('path', {
            d: this.getTrainPath(train.timetable, y),
            stroke: ouColorToHex(this.app.data.Rosen[0].Ressyasyubetsu[train.Syubetsu].DiagramSenColor)
          }, null, null, "http://www.w3.org/2000/svg")
        );
      });
    }

    const svgContent = document.createDocumentFragment();
    svgContent.append(...[...lines, h('g', { strokeWidth: 2, fill: 'none' }, paths, null, "http://www.w3.org/2000/svg")]);
    const timeContent = document.createDocumentFragment();
    timeContent.append(...timeLabels);
    const stationContent = document.createDocumentFragment();
    stationContent.append(...stationLabels);

    const func = () => {
      this.timeContainer.innerHTML = '';
      this.stationContainer.innerHTML = '';
      this.svgElement.innerHTML = '';
      // svg要素に突っ込む
      this.svgElement.setAttribute('width', 60 * 24 * this.xScale);
      this.svgElement.setAttribute('height', y);
      this.svgElement.setAttribute('viewBox', `0 0 ${60 * 24 * this.xScale} ${y}`);
      this.svgElement.appendChild(svgContent);

      // 固定部分のサイズ調整
      this.timeContainer.style.width = (80 + 60 * 24 * this.xScale) + 'px';
      this.timeContainer.appendChild(timeContent);
      this.stationContainer.style.height = (32 + y) + 'px';
      this.stationContainer.appendChild(stationContent);
    };

    // すぐに描画するなら描画処理を実行し、アニメーションする場合は描画処理の関数を返り値にする。
    if (immediate) {
      func();
    } else {
      return func;
    }
  }

  //上り列車のパスを計算するときは、heightにSVGの高さの値を入れる。
  getTrainPath(timetable, height = null) {
    let str = '';
    let mark = 'M';
    let y = height === null ? 8 : height - 8;
    const flag = (height !== null ? -1 : 1);
    // 最後に描画した地点のX,Y座標
    let lastX = -1;
    // 最後の停車駅からのY座標を進んだ距離(経由なしの区間を除く)
    let distance = 0;
    // 通過中に経由なしに入った場合には次の停車駅までx座標が決まらないので、y座標とその時点でのdistanceを控えておく。
    let pendingPoints = [];
    // 1駅ずつ見ていくよ！
    timetable.forEach((val, i) => {
      // 今回y座標を進む距離。
      const delta = flag * (this.stationDistance[height === null ? i : (this.stationDistance.length - 1 - i)] == Number.MAX_SAFE_INTEGER ? this.yScale : this.stationDistance[height === null ? i : (this.stationDistance.length - 1 - i)] * this.yScale);
      if (val !== null) {
        // 経由なしから飛び出した時。
        if (lastX != -1 && timetable[i - 1] && timetable[i - 1].stopType === 3 && timetable[i].stopType !== 3) {
          pendingPoints.push([y, distance]);
        }
        // 経由なしを通って停車駅まできたら、控えておいた点を結ぶ
        if (pendingPoints.length !== 0 && (val.departure !== null || val.arrival !== null)) {
          const x = (val.arrival !== null) ? (((val.arrival < this.startTime ? val.arrival + 24 * 60 : val.arrival) - this.startTime) * this.xScale) : (((val.departure < this.startTime ? val.departure + 24 * 60 : val.departure) - this.startTime) * this.xScale);
          for (let k = 0; k < pendingPoints.length; k++) {
            str += (k % 2 == 0 ? 'L' : 'M') + ((x - lastX) * pendingPoints[k][1] / distance + lastX) + ' ' + pendingPoints[k][0];
          }
          pendingPoints = [];
        }
        // 到着時刻
        if (val.arrival !== null) {
          const x = ((val.arrival < this.startTime ? val.arrival + 24 * 60 : val.arrival) - this.startTime) * this.xScale;
          str += `${mark}${x} ${y}`;
          lastX = x;
        }
        // 出発時刻
        if (val.departure !== null && val.departure !== val.arrival) {
          const x = ((val.departure < this.startTime ? val.departure + 24 * 60 : val.departure) - this.startTime) * this.xScale;
          str += `${mark}${x} ${y}`;
          lastX = x;
        }
        // 線を描いたら、distanceリセット
        if (val.departure !== null || val.arrival !== null) {
          mark = 'L';
          distance = 0;
        }
        // 経由なしに飛び込む時、そのy座標を控える
        if (lastX != -1 && timetable[i].stopType !== 3 && timetable[i + 1] && timetable[i + 1].stopType == 3) {
          pendingPoints.push([y, distance]);
        }
        if (timetable[i].stopType !== 3) distance += delta;
      }
      y += delta;
    });
    return str;
  }

  // 駅間距離(描画用)
  getStationDistanceArray() {
    return this.getMinimumRunTime();
  }
  // 駅間の最小所要時間(ただし1以上)
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
            result[isInbound ? len - i - 1 : i - 1] = Math.max(Math.min(result[isInbound ? len - i - 1 : i - 1], delta), 1);
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


