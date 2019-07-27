"use strict";

// TrainTimetableView.js (module)
// 列車時刻表を表示する。

const TableMark = {
  blank: "‥",
  pass: "ﾚ",
  nonroute: "||"
};

export default class TrainTimetableView {
  /**
   * 初期化 - データ編 -
   * @param {App}    app
   * @param {number} idx 何番目のDia
   * @param {string} key 'Nobori' or 'Kudari'
   */
  constructor(app, idx, key) {
    this.app = app;

    // 表示文字列の2次元配列
    const sheet = [['', '', '']];
    const colStyle = [null];
    const rowStyle = [0, 0, 0];
    const firstRowStyle = [];
    // ヘッダ行数
    this.headerRowCount = 3;
    // 時刻部分の行数→終着駅の後を埋めるのに使う
    let rowCount = 0;

    // 駅の着発表示を調べよー。
    const stations = this.app.data.Rosen[0].Eki;
    const len = stations.length;
    const trains = this.app.data.Rosen[0].Dia[idx][key][0].Ressya;
    const format = []; // 1:着, 2発, 3着発
    for (let i = 0; i < len; i++) {
      const station = stations[key === "Nobori" ? len - i - 1 : i];
      const keisiki = station.Ekijikokukeisiki;
      let val = 0;
      if (keisiki === (key === 'Nobori' ? 'Jikokukeisiki_NoboriChaku' : 'Jikokukeisiki_KudariChaku') || keisiki === 'Jikokukeisiki_Hatsuchaku') {
        val += 1;
      }
      if (keisiki === (key === 'Kudari' ? 'Jikokukeisiki_NoboriChaku' : 'Jikokukeisiki_KudariChaku') || keisiki === 'Jikokukeisiki_Hatsu' || keisiki === 'Jikokukeisiki_Hatsuchaku') {
        val += 2;
      }
      format.push(val);

      if (key === "Kudari") {
        sheet[0].push(station.Ekimei);
        rowCount++;
        if (val % 3 === 0) {
          sheet[0].push('---');
          rowStyle.push('#cccccc');
          rowCount++;
        }
        rowStyle.push(station.Kyoukaisen == "1" ? '#222222' : 'transparent');
      } else {
        sheet[0].push(station.Ekimei);
        if (val % 3 === 0) {
          sheet[0].push('---');
          rowStyle.push('#cccccc');
          rowCount++;
        }
        rowCount++;
        if (i < len - 1) rowStyle.push(stations[len - i - 2].Kyoukaisen == "1" ? '#222222' : 'transparent');
      }
    }

    // 列車を一つずつ見ていこー。
    trains.forEach(v => {
      // 1列分の表示テキストの配列
      const train = [];
      const trainType = this.app.data.Rosen[0].Ressyasyubetsu[v.Syubetsu];
      colStyle.push(ouColorToHex(trainType.JikokuhyouMojiColor));
      train.push(v.Ressyabangou);
      train.push(trainType.Ryakusyou);
      train.push(v.Ressyamei);
      v.timetable.forEach((data, i) => {
        if (!data) {
          train.push(TableMark.blank);
          if (format[i] % 4 === 3) train.push(TableMark.blank);
          return;
        }
        switch (data.stopType) {
          case 1:
            if ((format[i] & 1) === 1) {
              if(i > 0 && v.timetable[i-1] == null) train.push(TableMark.blank);
              else train.push(MinutesToHHMM(data.arrival) || MinutesToHHMM(data.departure));
            }
            if ((format[i] & 2) === 2) {
              if(i < v.timetable.length && v.timetable[i+1] == null)  train.push(TableMark.blank);
              else train.push(MinutesToHHMM(data.departure) || MinutesToHHMM(data.arrival));
            }
            break;
          case 2:
            train.push("ﾚ");
            if (format[i] % 4 === 3) train.push(TableMark.pass);
            break;
          case 3:
            train.push("||");
            if (format[i] % 4 === 3) train.push(TableMark.nonroute);
        }
      });
      /*
      v.EkiJikoku.split(',').forEach((str, i) => {
        if (str === "") {
          train.push(TableMark.blank);
          if (format[i] % 4 === 3) train.push(TableMark.blank);
          return;
        }
        const [type, times] = str.split(';');
        switch (type) {
          case '1':
            // eslint-disable-next-line no-case-declarations
            let arr, dep;
            if (times.includes('/')) {
              [arr, dep] = times.split('/');
            } else {
              arr = dep = times;
            }
            // eslint-disable-next-line no-case-declarations
            if ((format[i] & 1) === 1) train.push(arr);
            if ((format[i] & 2) === 2) train.push(dep);
            break;
          case '2':
            train.push("ﾚ");
            if (format[i] % 4 === 3) train.push(TableMark.pass);
            break;
          case '3':
            train.push("||");
            if (format[i] % 4 === 3) train.push(TableMark.nonroute);
        }
      });*/
      //終着駅後の空欄埋め
      for (let i = train.length - this.headerRowCount; i < rowCount; i++)train.push(TableMark.blank);
      sheet.push(train);
    });

    // 表データできました、あとの表示処理は頼んだぞ！
    this.sheet = sheet;
    this.colStyle = colStyle;
    this.rowStyle = rowStyle;
  }

  // 初期化 - 描画編 -
  render() {
    this.wrapper = document.getElementById('mainWindow');
    // wrapper > (tBody, tFixedRows, tFixedCols)
    let tBody = document.createElement('div');
    tBody.id = "largeTable-body";
    this.tBody = tBody;
    this.wrapper.appendChild(tBody);

    let tFixedRows = document.createElement('div');
    tFixedRows.id = "largeTable-fixedRows";
    this.tFixedRows = tFixedRows;
    this.wrapper.appendChild(tFixedRows);

    let tFixedCols = document.createElement('div');
    tFixedCols.id = "largeTable-fixedCols";
    this.tFixedCols = tFixedCols;
    this.wrapper.appendChild(tFixedCols);

    this.sheetWidth = this.sheet.length;
    this.sheetHeight = this.sheet[0].length;

    this.cellWidth = 40;
    this.cellHeight = 16;
    this.stationCellWidth = 80;

    // 表示テキストの2次元配列
    this.sheet = this.sheet;
    // 縦列の色の1次元配列
    this.colStyle = this.colStyle;
    // 1なら境界線
    this.rowStyle = this.rowStyle;
    // divちゃん達の管理
    this.tBodyDivs = new Map();
    this.tFixedRowDivs = new Map();
    this.tFixedColDivs = new Map();
    // 最終描画領域。座標ではなくセル番号
    this.lastBox = { x: -100, y: -100, w: 0, h: 0 };

    this.wrapper.addEventListener('scroll', () => this.update()); //スクロールで再描画
    const str = document.createTextNode(
      `.largeTable-cell{
        position: absolute;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        line-height: 1;
        font-size: 13px;
        text-align: center;
        border-bottom: 1px solid transparent;
      }
      #largeTable-body {
        width: ${this.cellWidth * this.sheet.length}px;
        height: ${this.cellHeight * this.sheet[0].length}px;
        position: absolute;
        left: ${this.stationCellWidth - this.cellWidth}px;
      }
      #largeTable-fixedRows {
        position: -webkit-sticky;
        position: sticky;
        top: 0;
        width: ${this.cellWidth * this.sheet.length + this.stationCellWidth}px;
        height: ${this.cellHeight * this.headerRowCount}px;
        background-color: var(--app-bg-color);
        box-shadow: 0 -10px 2px 10px #00000088;
        z-index: 3;
      }
      #largeTable-fixedCols {
        position: -webkit-sticky;
        position: sticky;
        left: 0;
        width: ${this.stationCellWidth}px;
        height: ${this.cellHeight * this.sheet[0].length}px;
        background-color: var(--app-bg-color);
        box-shadow: -10px 0 2px 10px #00000088;
        z-index: 2;
      }
      #largeTable-fixedCols>.largeTable-cell{
        text-align:right;
      }
      #largeTable-leftTop {
        position: fixed;
        left: 0;
        top: 0;
        width: ${this.stationCellWidth}px;
        height: ${this.cellHeight * this.headerRowCount}px;
        background-color: #ffffff;
        background-image: url(img/logo_icon_white.svg);
      }
      `);
    let style = this.styleElement = document.createElement('style');
    style.appendChild(str);
    document.head.appendChild(style);
    this.update();
  }

  // 画面更新。スクロールがトリガー。
  // 新たに画面に入ってきた要素と、画面から出ていく要素を検出して、差分を修正。
  update() {
    /*** Step1.表示領域の確認 ***/

    const VIEW_WIDTH = this.wrapper.offsetWidth;
    const VIEW_HEIGHT = this.wrapper.offsetHeight;
    const VIEW_X = this.wrapper.scrollLeft;
    const VIEW_Y = this.wrapper.scrollTop;

    // 現在の表示領域における、 時 刻 部 分 の 左上のセル番地と右下のセル番地。
    let [i0, j0] = this.getCellByCoordinate(VIEW_X + this.stationCellWidth, VIEW_Y + this.cellHeight * this.headerRowCount);
    let [iM, jM] = this.getCellByCoordinate(VIEW_X + this.stationCellWidth + VIEW_WIDTH, VIEW_Y + VIEW_HEIGHT);
    i0 = Math.max(i0 - 10, 0);// 種別等の情報を左側ギリギリまで文字を消さない
    j0 = Math.max(j0 - 10, 0);
    iM = Math.min(iM + 10, this.sheetWidth - 1);// 画面外には行かせないっ
    jM = Math.min(jM + 10, this.sheetHeight - 1);// 画面外には行かせないっ

    // 表示領域変わってないなら帰るわ
    if (i0 - 5 < this.lastBox.x && j0 -5 < this.lastBox.y && iM + 5 > this.lastBox.x + this.lastBox.w && jM + 5 >  this.lastBox.y + this.lastBox.h) return;


    /*** Step2.再利用できるDIVを集める ***/

    // [1]時刻部分
    //画面外に行ってしまったdivちゃんを探せ。再利用したいなぁ
    const reusableTBodyDivs = new Map();
    for (let element of this.tBodyDivs) {
      const col = element[0] >> 20;
      const row = element[0] % 1048576;
      if (col < i0 || iM < col || row < j0 || jM < row) reusableTBodyDivs.set(element[0], element[1]);
    }
    // 要素の追加については、毎回appendChildをするとDOM更新が多いのでFragmentにまとめて最後に一括更新。
    const fragmentBody = document.createDocumentFragment();
    const iteratorBody = reusableTBodyDivs.entries();

    // [2]上部  (同じようなコードを繰り返し書くのダサいな)
    const reusableFixedRowDivs = new Map();
    for (let element of this.tFixedRowDivs) {
      const col = element[0] >> 20;
      if (col < i0 || iM < col) reusableFixedRowDivs.set(element[0], element[1]);
    }
    const fragmentFixedRow = document.createDocumentFragment();
    const iteratorFixedRow = reusableFixedRowDivs.entries();

    // [3]左側  (やっぱりダサいけど気にしない)
    const reusableFixedColDivs = new Map();
    for (let element of this.tFixedColDivs) {
      const row = element[0] % 1048576;
      if (row < j0 || jM < row) reusableFixedColDivs.set(element[0], element[1]);
    }
    const fragmentFixedCol = document.createDocumentFragment();
    const iteratorFixedCol = reusableFixedColDivs.entries();


    /*** Step3.差分を修正する ***/

    for (let i = i0; i <= iM; i++) {
      // [1]上部(種別等)
      for (let j = 0; j < this.headerRowCount; j++) {
        // 横方向の更新がなければ帰りましょ
        if (this.lastBox.x <= i && i <= this.lastBox.x + this.lastBox.w) continue;
        if (this.tFixedRowDivs.has(i * 1048576 + j)) continue;
        this.addCell({
          fragment: fragmentFixedRow,
          iterator: iteratorFixedRow,
          elementSet: this.tFixedRowDivs,
          content: this.sheet[i][j],
          key: i * 1048576 + j,
          color: this.colStyle[i],
          x: this.cellWidth * (i - 1) + this.stationCellWidth,
          y: this.cellHeight * j,
          w: this.cellWidth,
          h: this.cellHeight,
          border: this.rowStyle[j]
        });
      }
      // [2]時刻部分
      for (let j = j0; j <= jM; j++) {
        // 画面内はもう書いたよね
        if (this.lastBox.x <= i && i <= this.lastBox.x + this.lastBox.w && this.lastBox.y <= j && j <= this.lastBox.y + this.lastBox.h) continue;
        // まだ再利用されてない生き残りが生還したら有効活用。
        if (this.tBodyDivs.has(i * 1048576 + j)) continue;
        this.addCell({
          fragment: fragmentBody,
          iterator: iteratorBody,
          elementSet: this.tBodyDivs,
          content: this.sheet[i][j],
          key: i * 1048576 + j,
          color: this.colStyle[i],
          x: this.cellWidth * i,
          y: this.cellHeight * j,
          w: this.cellWidth,
          h: this.cellHeight,
          border: this.rowStyle[j],
          bg: j % 2 == 0
        });
      }
    }
    // [3]左側(駅名)
    for (let j = j0; j <= jM; j++) {
      // 横方向の更新がなければ帰りましょ
      if (this.lastBox.y <= j && j <= this.lastBox.y + this.lastBox.h) continue;
      if (this.tFixedColDivs.has(j)) continue;
      // 着発(下段)はスキップ
      if (this.sheet[0][j] == '---') continue;
      // 着発(上段)
      if (this.rowStyle[j] == '#cccccc') {
        this.addCell({
          fragment: fragmentFixedCol,
          iterator: iteratorFixedCol,
          elementSet: this.tFixedColDivs,
          content: this.sheet[0][j],
          key: j,
          color: '#444444',
          x: 0,
          y: this.cellHeight * (j - this.headerRowCount),
          w: this.stationCellWidth,
          h: this.cellHeight,
          border: 'transparent',
          padding: this.cellHeight / 2
        });
      } else {
        this.addCell({
          fragment: fragmentFixedCol,
          iterator: iteratorFixedCol,
          elementSet: this.tFixedColDivs,
          content: this.sheet[0][j],
          key: j,
          color: '#444444',
          x: 0,
          y: this.cellHeight * (j - this.headerRowCount),
          w: this.stationCellWidth,
          h: this.cellHeight,
          border: this.rowStyle[j],
          padding: 0
        });
      }

    }
    this.tBody.appendChild(fragmentBody);
    this.tFixedRows.appendChild(fragmentFixedRow);
    this.tFixedCols.appendChild(fragmentFixedCol);

    // 表示領域(セル番地)を更新
    this.lastBox = { x: i0, y: j0, w: iM - i0, h: jM - j0 };
  }
  addCell({ fragment, iterator, content, elementSet, key, color, x, y, w, h, border, bg = false, padding = null }) {
    // 画面外のdivちゃんがいれば再利用、そうじゃなきゃdivちゃんを出産。
    const iResult = iterator.next();
    let div;
    if (iResult.done) {
      div = document.createElement('div');
      div.className = 'largeTable-cell';
      div.style.width = w + 'px';
      div.style.height = h + 'px';
    } else {
      div = iResult.value[1];
      elementSet.delete(iResult.value[0]);//key変更につき一旦削除
    }
    div.textContent = content;
    div.style.left = x + 'px';
    div.style.top = y + 'px';
    div.style.color = color;
    div.style.borderBottomColor = border;
    div.style.backgroundColor = bg ? '#a552ff0a' : 'transparent';
    if (padding != null) div.style.padding = padding + 'px 0';
    elementSet.set(key, div);
    if (iResult.done) {
      fragment.appendChild(div);
    }
  }
  // containerの座標からセル番地を求める
  getCellByCoordinate(x, y) {
    return [Math.floor((x - this.stationCellWidth) / this.cellWidth), Math.floor(y / this.cellHeight)];
  }
  finish() {
    document.head.removeChild(this.styleElement);
  }
}

const ouColorToHex = (ouColor) => {
  const b = ouColor.slice(2, 4);
  const g = ouColor.slice(4, 6);
  const r = ouColor.slice(6, 8);
  return '#' + r + g + b;
};
const MinutesToHHMM = (min) => {
  if (!min) return null;
  return Math.floor(min / 60) + '' + String(min % 60).padStart(2, '0');
}