'use strict';

import View from "./View.js";
import { h, ouColorToHex, MinutesToHHMM } from "./Util.js";

// CanvasDiagramView.js (module)
// ダイヤグラムを表示する。斜め線いっぱいのやつ。
// より高速化を目指しCanvasで書き直します！1から？いいえ0から！
export default class CanvasDiagramView extends View {
  constructor(app, idx) {
    super(app);
    // 高解像端末対応
    this.devicePixelRatio = window.devicePixelRatio;// そのうち低解像度にする設定でもつける？ iPad mini2だとキツイ。ここを下げるだけ
    this.canvasScale = 1 / this.devicePixelRatio;
    // 何番目のダイヤか
    this.idx = idx;
    // 利用するデータ群
    this.stations = this.app.data.Rosen[0].Eki;
    this.inboundTrains = this.app.data.Rosen[0].Dia[idx]['Nobori'][0].Ressya;
    this.outboundTrains = this.app.data.Rosen[0].Dia[idx]['Kudari'][0].Ressya;
    // 表示サイズ
    this.xScale = 10 * this.devicePixelRatio;
    this.yScale = 20 * this.devicePixelRatio;
    this.minXScale = 1.5 * this.devicePixelRatio;
    this.minYScale = 5.0 * this.devicePixelRatio;
    this.maxXScale = 35 * this.devicePixelRatio;
    this.maxYScale = 35 * this.devicePixelRatio;
    this.reservedScale = [];
    this.paddingTop = 16 * this.devicePixelRatio;
    this.paddingLeft = 80 * this.devicePixelRatio;
    this.visibleInbound = true;
    this.visibleOutbound = false;
    this.visibleTrainNumber = false;
    this.visibleTrainName = false;
    // スクロール、倍率変更以外に、再描画が必要な場合true
    this.forceDraw = false;
    // 描画の開始時刻1日の始まりは4時から。
    this.startTime = 4 * 60;
    // 駅間距離
    this.stationDistance = this.getStationDistanceArray();
    // 描画データ
    this.drawingData = this.calcDrawingData();
    this.lastPosition = { x: -100, y: -100, w: 1, h: 1 };
    // モバイル
    this.isScaling = false;
  }
  // 初回描画。
  render() {
    this.window = document.getElementById('mainWindow');
    // 右下(ボタン群)
    const toolContainer = h('div', { id: 'diagram-tools' }, [
      h('div', { id: 'diagram-tools-container1', class: 'diagram-tools-container' }, [
        h('div', { id: 'diagram-tools-zoomin', class: 'diagram-tools-button' }, h('img', { class: 'diagram-tools-svgicon', src: 'img/plus.svg' }), () => this.scale(this.xScale * 1.5, this.yScale * 1.5, true)),
        h('div', { id: 'diagram-tools-zoomout', class: 'diagram-tools-button' }, h('img', { class: 'diagram-tools-svgicon', src: 'img/minus.svg' }), () => this.scale(this.xScale / 1.5, this.yScale / 1.5, true))
      ]),
      h('div', { id: 'diagram-tools-container3', class: 'diagram-tools-container' }, [
        h('label', { class: 'diagram-tools-button' }, [
          h('input', { class: 'diagram-tools-input', type: 'checkbox'}, null,() => { this.visibleTrainNumber = !this.visibleTrainNumber; this.forceDraw = true; }),
          h('img', { class: 'diagram-tools-svgicon', src: 'img/trainNumber.svg' })
        ]),
        h('label', { class: 'diagram-tools-button diagram-tools-button-rightMargin' }, [
          h('input', { class: 'diagram-tools-input', type: 'checkbox'},null, () => { this.visibleTrainName = !this.visibleTrainName; this.forceDraw = true; }),
          h('img', { class: 'diagram-tools-svgicon', src: 'img/trainName.svg' })
        ]),
        h('label', { class: 'diagram-tools-button' }, [
          h('input', { class: 'diagram-tools-input', name: 'diagram-tools-direction', type: 'radio', checked: 'checked' }),
          h('img', { class: 'diagram-tools-svgicon', src: 'img/inbound.svg' })
        ], () => { this.visibleOutbound = false; this.visibleInbound = true; this.forceDraw = true; }),
        h('label', { class: 'diagram-tools-button' }, [
          h('input', { class: 'diagram-tools-input', name: 'diagram-tools-direction', type: 'radio' }),
          h('img', { class: 'diagram-tools-svgicon', src: 'img/both_directions.svg' }),
        ], () => { this.visibleOutbound = true; this.visibleInbound = true; this.forceDraw = true; }),
        h('label', { class: 'diagram-tools-button diagram-tools-button-rightMargin' }, [
          h('input', { class: 'diagram-tools-input', name: 'diagram-tools-direction', type: 'radio' }),
          h('img', { class: 'diagram-tools-svgicon', src: 'img/outbound.svg' })
        ], () => { this.visibleOutbound = true; this.visibleInbound = false; this.forceDraw = true; }),
        h('div', { id: 'diagram-tools-narrow', class: 'diagram-tools-button' }, h('img', { class: 'diagram-tools-svgicon', src: 'img/narrow.svg' }), () => this.scale(this.xScale / 1.25, this.yScale, true)),
        h('div', { id: 'diagram-tools-widen', class: 'diagram-tools-button' }, h('img', { class: 'diagram-tools-svgicon', src: 'img/widen.svg' }), () => this.scale(this.xScale * 1.25, this.yScale, true))
      ]),
    ]);
    this.canvasWrapper = h('div', { id: 'diagram-canvasWrapper' });
    this.canvas = h('canvas', { id: 'diagram-canvas' });
    this.canvas.style.transform = `scale(${this.canvasScale})`;
    this.canvas.width = this.window.offsetWidth * this.devicePixelRatio;
    this.canvas.height = this.window.offsetHeight * this.devicePixelRatio;
    this.context = this.canvas.getContext('2d');
    this.canvasWrapper.appendChild(this.canvas);

    this.window.addEventListener('touchstart', (e) => this.touchstart(e), true);
    this.window.addEventListener('touchmove', (e) => this.pinchScaling(e), false);
    this.window.addEventListener('touchend', (e) => this.pinchEnd(e), false);
    this.window.append(toolContainer, this.canvasWrapper);
    this.scale(10, 20);
    this.draw();
  }
  setWrapperSize(w, h) {
    this.canvasWrapper.style.width = w / this.devicePixelRatio + 'px';
    this.canvasWrapper.style.height = h / this.devicePixelRatio + 'px';
  }
  scale(newXScale = this.xScale, newYScale = this.yScale, animation = false) {
    if (animation) {
      let OriginXScale, OriginYScale;
      if (this.reservedScale.length !== 0) {
        [OriginXScale, OriginYScale] = this.reservedScale[this.reservedScale.length - 1];
      } else {
        [OriginXScale, OriginYScale] = [this.xScale, this.yScale];
      }
      this.reservedScale = this.getEaseAnimScales(OriginXScale, OriginYScale, newXScale, newYScale, 12);
    } else {
      this.reservedScale.push([newXScale, newYScale]);
    }
  }
  // user-scalable=noが適用されないiOSでの拡大を防ぐ
  touchstart(event) {
    if (event.touches.length > 1 && event.cancelable) {
      event.preventDefault();
    }
  }
  // ピンチによる拡大縮小(モバイル)
  pinchScaling(event) {
    const touches = event.changedTouches;
    if (touches.length < 2) return;
    if (event.cancelable) event.preventDefault();
    // 指の間の距離
    const x0 = touches[0].clientX * this.devicePixelRatio;
    const y0 = touches[0].clientY * this.devicePixelRatio;
    const x1 = touches[1].clientX * this.devicePixelRatio;
    const y1 = touches[1].clientY * this.devicePixelRatio;
    const dx = Math.max(75 * this.devicePixelRatio, Math.abs(x1 - x0));
    const dy = Math.max(75 * this.devicePixelRatio, Math.abs(y1 - y0));
    // 今ピンチが始まったかどうか
    if (this.isScaling === false) {
      this.isScaling = true;
      this.pinchStart = { x0, y0, dx, dy, xScale: this.xScale, yScale: this.yScale, px: this.lastPosition.x, py: this.lastPosition.y };
    } else {
      this.reservedScale = [[
        Math.max(this.minXScale, Math.min(this.maxXScale, this.pinchStart.xScale * dx / this.pinchStart.dx)), // x scale
        Math.max(this.minYScale, Math.min(this.maxYScale, this.pinchStart.yScale * dy / this.pinchStart.dy)), // y scale
        Math.max(0, (this.pinchStart.px + this.pinchStart.x0 - this.paddingLeft) * dx / this.pinchStart.dx - x0 + this.paddingLeft), // left
        Math.max(0, (this.pinchStart.py + this.pinchStart.y0 - this.paddingTop) * dy / this.pinchStart.dy - y0 + this.paddingTop)  // top
      ]];
    }
  }
  // 拡大縮小の終了
  pinchEnd() {
    this.isScaling = false;
  }
  // 実際の描画
  draw() {
    /**** 準備 ****/
    const position = {
      x: this.window.scrollLeft * this.devicePixelRatio,
      y: this.window.scrollTop * this.devicePixelRatio,
      w: this.window.offsetWidth * this.devicePixelRatio,
      h: this.window.offsetHeight * this.devicePixelRatio
    };
    if(position.x / this.devicePixelRatio < 600)this.paddingLeft = 50 * this.devicePixelRatio;
    // 再描画は必要か？
    if (this.forceDraw || this.reservedScale.length !== 0 || position.x !== this.lastPosition.x || position.y !== this.lastPosition.y || this.reservedScale.length !== 0 || position.w !== this.lastPosition.w || position.h !== this.lastPosition.h) {
      // 表示倍率を変更するか？
      if (this.reservedScale.length !== 0) {
        const rData = this.reservedScale.shift();
        // 新しい表示倍率
        this.xScale = rData[0];
        this.yScale = rData[1];
        // スクロール位置。ダイヤグラム全体が基準の座標。
        position.x = rData[2];
        position.y = rData[3];
        // 更新
        this.setWrapperSize(24 * 60 * this.xScale + this.paddingTop + 50, this.drawingData.totalDistance[this.drawingData.totalDistance.length - 1] * this.yScale + this.paddingLeft + 50);
        this.window.scrollLeft = position.x / this.devicePixelRatio;
        this.window.scrollTop = position.y / this.devicePixelRatio;
      }
      // canvas初期化
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.font = Math.min(12 * this.devicePixelRatio, this.yScale) + 'px "Noto Sans JP"';
      this.context.fillStyle = '#444444';
      this.context.lineWidth = 1;

      /**** 描画 横罫線+駅名 ****/
      this.context.beginPath();
      this.context.strokeStyle = '#dddddd';
      this.context.textAlign = 'right';
      this.context.textBaseline = 'bottom';
      const stationLen = this.drawingData.totalDistance.length;
      for (let i = 0; i < stationLen; i++) {
        const y = this.drawingData.totalDistance[i] * this.yScale;
        if (y + this.paddingTop - position.y < 0) continue;
        if (position.y + position.h < y) break;
        this.context.moveTo(0, Math.floor(y - position.y + this.paddingTop) + 0.5);
        this.context.lineTo(y - position.y < 0 ? this.paddingLeft : position.w, Math.floor(y - position.y + this.paddingTop) + 0.5);
        this.context.fillText(this.stations[i].Ekimei, this.paddingLeft, y - position.y + this.paddingTop, this.paddingLeft);
      }
      this.context.stroke();

      /**** 描画 縦罫線+時刻 ****/
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
      // 駅名部分に被らないように描画範囲の絞り込み
      this.context.save();
      this.context.rect(this.paddingLeft, 0, this.canvas.width - this.paddingLeft, this.canvas.height);
      this.context.clip();
      // 書式設定
      this.context.font = 12 * this.devicePixelRatio + 'px "Noto Sans JP"';
      this.context.textAlign = 'center';
      this.context.textBaseline = 'bottom';
      // stroke数を減らすために、d1,d2は最後にまとめて描画。d3は初回なので変数に入れる必要ない。
      const d1x = new Set();
      const d2x = new Set();
      // d3
      this.context.beginPath();
      this.context.setLineDash([3, 1.5]);
      this.context.strokeStyle = '#dddddd';
      for (let x = Math.ceil((position.x - this.paddingLeft) / this.xScale / d3) * d3; x * this.xScale < position.x + position.w; x += d3) {
        if (x % d1 === 0) {
          this.context.fillText(MinutesToHHMM(x + this.startTime, ':'), x * this.xScale - position.x + this.paddingLeft, this.paddingTop);
          d1x.add(x);
        } else if (x % d2 == 0) {
          d2x.add(x);
        } else {
          this.context.moveTo(0.5 + Math.floor(x * this.xScale - position.x + this.paddingLeft), this.paddingTop);
          this.context.lineTo(0.5 + Math.floor(x * this.xScale - position.x + this.paddingLeft), position.h);
        }
      }
      this.context.stroke();
      // d2
      this.context.setLineDash([]);
      this.context.beginPath();
      for (const x of d2x) {
        this.context.moveTo(0.5 + Math.floor(x * this.xScale - position.x + this.paddingLeft), this.paddingTop);
        this.context.lineTo(0.5 + Math.floor(x * this.xScale - position.x + this.paddingLeft), position.h);
      }
      this.context.stroke();
      // d1
      this.context.beginPath();
      this.context.strokeStyle = '#bbbbbb';
      for (const x of d1x) {
        this.context.moveTo(0.5 + Math.floor(x * this.xScale - position.x + this.paddingLeft), this.paddingTop);
        this.context.lineTo(0.5 + Math.floor(x * this.xScale - position.x + this.paddingLeft), position.h);
      }
      this.context.stroke();
      // 描画範囲の絞り込みを解除
      this.context.restore();


      /**** 描画 列車 ****/
      // 描画範囲を限定
      this.context.save();
      this.context.rect(this.paddingLeft, this.paddingTop, this.canvas.width - this.paddingLeft, this.canvas.height - this.paddingTop);
      this.context.clip();
      this.context.lineWidth = this.devicePixelRatio;

      this.context.textAlign = 'left';
      this.context.textBaseline = 'bottom';

      // 色ごとにまとめてstrokeするから、
      // まずは、画面内か判定して色ごとに分類
      const paths = {};
      const xl = - position.x + this.paddingLeft;
      const yt = - position.y + this.paddingTop;
      const xw = position.x + position.w;
      const selectTrains = (trains) => {
        const len = trains.length;
        for (let i = 0; i < len; i++) {
          const val = trains[i];
          // 画面外は描かないよ
          if (position.w < val.path[1] * this.xScale + xl || val.path[val.path.length - 2] * this.xScale + xl < 0) continue;
          if (!(val.color in paths)) {
            paths[val.color] = [val];
          } else {
            paths[val.color].push(val);
          }
        }
      };
      if (this.visibleInbound) selectTrains(this.drawingData.inbound);
      if (this.visibleOutbound) selectTrains(this.drawingData.outbound);

      //そんで線を引く
      for (let color in paths) {
        this.context.beginPath();
        this.context.strokeStyle = color;
        this.context.fillStyle = color;
        for (const val of paths[color]) {
          const len = val.path.length;
          if (this.visibleTrainNumber || this.visibleTrainName) {
            this.context.save();
            this.context.translate(val.path[1] * this.xScale + xl, val.path[2] * this.yScale + yt);
            this.context.rotate(Math.atan((val.path[5] - val.path[2]) * this.yScale / (val.path[4] - val.path[1]) / this.xScale));
            this.context.fillText((this.visibleTrainNumber === true ? val.trainNumber + ' ' : '') + (this.visibleTrainName === true ? val.trainName : ''), 0, 0);
            this.context.restore();
          }
          for (let i = 0; i < len; i += 3) {
            const x = val.path[i + 1] * this.xScale + xl;
            const y = val.path[i + 2] * this.yScale + yt;
            this.context[val.path[i] === true ? 'lineTo' : 'moveTo'](x, y);
            if (x > xw) break;
          }
        }
        this.context.stroke();
      }

      // 描画範囲を復元
      this.context.restore();
      this.context.lineWidth = 1;
      this.context.beginPath();
      // 描画 影
      // グラデーションは遅延の元なので手書きする。あらかじめ書いて再利用するのがいいのかと思ったりする
      this.context.strokeStyle = "#00000044";
      this.context.moveTo(0.5 + this.paddingLeft, 0.5 + 0);
      this.context.lineTo(0.5 + this.paddingLeft, 0.5 + this.canvas.height);
      this.context.moveTo(0.5 + this.paddingLeft, 0.5 + this.paddingTop);
      this.context.lineTo(0.5 + this.canvas.width, 0.5 + this.paddingTop);
      this.context.stroke();
      this.context.strokeStyle = "#0000001b";
      this.context.moveTo(0.5 + this.paddingLeft + 1, 0.5 + 0);
      this.context.lineTo(0.5 + this.paddingLeft + 1, 0.5 + this.canvas.height);
      this.context.moveTo(0.5 + this.paddingLeft, 0.5 + this.paddingTop + 1);
      this.context.lineTo(0.5 + this.canvas.width, 0.5 + this.paddingTop + 1);
      this.context.stroke();
      this.context.strokeStyle = "#00000005";
      this.context.moveTo(0.5 + this.paddingLeft + 2, 0.5 + 0);
      this.context.lineTo(0.5 + this.paddingLeft + 2, 0.5 + this.canvas.height);
      this.context.moveTo(0.5 + this.paddingLeft, 0.5 + this.paddingTop + 2);
      this.context.lineTo(0.5 + this.canvas.width, 0.5 + this.paddingTop + 2);
      this.context.stroke();



      // 次回、位置が動いたか確認できるように記録
      this.lastPosition = position;
      this.forceDraw = false;
    }
    requestAnimationFrame(this.draw.bind(this));
  }
  drawBreak() {
    requestAnimationFrame(this.drawBreak2.bind(this));
  }
  drawBreak2() {
    requestAnimationFrame(this.draw.bind(this));
  }

  // 描画データの計算
  calcDrawingData() {
    const totalDistance = [1];
    let y = 1;
    for (let i = 0; i < this.stationDistance.length; i++) {
      y += (this.stationDistance[i] === Number.MAX_SAFE_INTEGER ? 1 : this.stationDistance[i]);
      totalDistance.push(y);
    }
    const outbound = this.outboundTrains.map(train => ({
      path: this.getTrainDrawingData(train.timetable),
      color: ouColorToHex(this.app.data.Rosen[0].Ressyasyubetsu[train.Syubetsu].DiagramSenColor),
      trainNumber: train.Ressyabangou || '',
      trainName: train.Ressyamei || ''
    }));
    const inbound = this.inboundTrains.map(train => ({
      path: this.getTrainDrawingData(train.timetable, y),
      color: ouColorToHex(this.app.data.Rosen[0].Ressyasyubetsu[train.Syubetsu].DiagramSenColor),
      trainNumber: train.Ressyabangou || '',
      trainName: train.Ressyamei || ''
    }));
    return { totalDistance, outbound, inbound };
  }

  //上り列車のパスを計算するときは下から座標を引いていくので、heightに高さの値を入れる。
  getTrainDrawingData(timetable, height = null) {
    // 最後に出力する
    let result = [];
    // trueなら線は接続する
    let connection = false;
    let y = height === null ? 1 : (height);
    // 上り列車の時はy座標を減らしていく
    const sign = (height !== null ? -1 : 1);
    // 最後に描画した地点のX,Y座標
    let lastX = -1;
    // 最後の停車駅からのY座標を進んだ距離(経由なしの区間を除く)
    let distance = 0;
    // 通過中に経由なしに入った場合には次の停車駅までx座標が決まらないので、y座標とその時点でのdistanceを控えておく。
    let pendingPoints = [];
    // 1駅ずつ見ていくよ！
    timetable.forEach((val, i) => {
      // 今回y座標を進む距離。
      const d = this.stationDistance[height === null ? i : (this.stationDistance.length - 1 - i)];
      const delta = sign * (d === Number.MAX_SAFE_INTEGER ? 1 : d);
      if (val !== null) {
        // 経由なしから飛び出した時。
        if (lastX != -1 && timetable[i - 1] && timetable[i - 1].stopType === 3 && timetable[i].stopType !== 3) {
          pendingPoints.push([y, distance]);
        }
        // 経由なしを通って停車駅まできたら、控えておいた点を結ぶ
        if (pendingPoints.length !== 0 && (val.departure !== null || val.arrival !== null)) {
          const x = (val.arrival !== null) ? (((val.arrival < this.startTime ? val.arrival + 24 * 60 : val.arrival) - this.startTime)) : (((val.departure < this.startTime ? val.departure + 24 * 60 : val.departure) - this.startTime));
          for (let k = 0; k < pendingPoints.length; k++) {
            result.push((k % 2 === 0), (x - lastX) * pendingPoints[k][1] / distance + lastX, pendingPoints[k][0]);
          }
          pendingPoints = [];
        }
        // 到着時刻
        if (val.arrival !== null) {
          const x = ((val.arrival < this.startTime ? val.arrival + 24 * 60 : val.arrival) - this.startTime);
          if (connection === false && result[result.length - 3] === false) result = result.slice(0, -3);
          result.push(connection, x, y);
          lastX = x;
        }
        // 出発時刻
        if (val.departure !== null && val.departure !== val.arrival) {
          const x = ((val.departure < this.startTime ? val.departure + 24 * 60 : val.departure) - this.startTime);
          if (connection === false && result[result.length - 3] === false) result = result.slice(0, -3);
          result.push(connection, x, y);
          lastX = x;
        }
        // 線を描いたら、distanceリセット
        if (val.departure !== null || val.arrival !== null) {
          connection = true;
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
    return result;
  }
  // 駅間距離(描画用)
  getStationDistanceArray() {
    return this.getMinimumRunTime();
  }
  // 駅間の最小所要時間(ただし1以上)
  getMinimumRunTime() {
    const len = this.stations.length;
    // 結果は初期値-1で埋めておく
    const result = new Array(len - 1).fill(Number.MAX_SAFE_INTEGER);
    // 最小値。たまに出力される駅間0分を防ぐ
    const minimum = 1;
    const f = (trains, isInbound) => {
      trains.forEach(train => {
        // 前駅の発車時刻
        let prevDep = null;
        train.timetable.forEach((val, i) => {
          // 停車駅でない
          if (val === null || (val.arrival === null && val.departure === null)) {
            prevDep = null;
            return;
          }
          // 前駅に停車している
          if (prevDep != null) {
            let delta = (val.arrival || val.departure) - prevDep;
            if (delta < 0) delta += 24 * 60;
            result[isInbound ? len - i - 1 : i - 1] = Math.max(minimum, Math.min(delta, result[isInbound ? len - i - 1 : i - 1]));
          }
          // 発車時刻を記録
          prevDep = val.departure;
        });
      });
    };
    f(this.inboundTrains, true);
    f(this.outboundTrains, false);
    return result;
  }
  getEaseAnimScales(xOrig, yOrig, xNew, yNew, frames) {
    const result = [];
    for (let i = 0; i < frames; i++) {
      const t = i / frames;
      const tp = 1 - t;
      const sx = xOrig + (t * t * t + 3 * t * t * tp * 0.58) * (xNew - xOrig);
      const sy = yOrig + (t * t * t + 3 * t * t * tp * 0.58) * (yNew - yOrig);

      result.push([
        sx,
        sy,
        Math.max(0, (this.lastPosition.x + this.lastPosition.w / 2) * sx / xOrig - this.lastPosition.w / 2),
        Math.max(0, (this.lastPosition.y + this.lastPosition.h / 2) * sy / yOrig - this.lastPosition.h / 2)
      ]);
    }
    return result;
  }
}