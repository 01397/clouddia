import App from '../App.js';
import { Train, TrainType } from '../DiagramParser.js';
import { h, numberToTimeString, timeFormat } from '../Util.js';
import View from './View.js';
import TrainSubview from './TrainSubview.js';

// TrainTimetableView.js (module)
// 列車時刻表を表示する。

const TABLE_MARK = {
  blank: '‥',
  nonroute: '||',
  pass: '\u00a0ﾚ',
  stop: '○',
};

export default class TrainTimetableView extends View {
  private stationStyle: Array<{
    arrival: boolean;
    departure: boolean;
    border: boolean;
  }>;
  private tBody: HTMLElement;
  private tHeader: HTMLElement;
  private tStation: HTMLElement;
  private cellHeight: number;
  private stationCellWidth: number;
  private diaIndex: number;
  private direction: number;
  private timeFormat: timeFormat;
  private sheet: Array<{
    number: string;
    type: TrainType;
    name: string;
    note: string;
    count: string;
    cells: Array<{
      text: string;
      color: string;
      bg: boolean;
      border: boolean;
      cellName: string;
      address: string;
    }>;
  }>;
  private cellWidth: number;
  private lastArea: { x: number; w: number };
  private headerHeight: number;
  private columns: Map<number, { header: HTMLElement; body: HTMLElement }>;
  private rendering: boolean;
  private reqId: number;
  private focusElement: HTMLElement;
  private selectedCell: Array<{ col: number; row: number; cellType: string; stationIndex: number }>;

  constructor(app: App, diaIndex: number, direction: number) {
    super(app, direction === 0 ? 'OutboundTrainTimetable' : 'InboundTrainTimetable', [
      {
        label: '列車',
        submenu: [
          { label: '左に列車を挿入', accelerator: 'Alt+Left', click: () => this.insertTrain(this.getActiveCell[0]) },
          { label: '右に列車を挿入', accelerator: 'Alt+Right', click: () => this.insertTrain(this.getActiveCell[0] + 1) },
        ],
      },
    ]);

    // 表示設定
    this.diaIndex = diaIndex;
    this.direction = direction;
    this.sheet = [];
    this.timeFormat = 'HMM_space';
    this.stationStyle = [];
    // 定数たち
    this.cellWidth = 40;
    this.cellHeight = 16;
    this.stationCellWidth = 80;
    this.headerHeight = 36;
    // 要素
    this.focusElement = h('div', { id: 'tt-focus' }) as HTMLDivElement;
    this.tBody = h('div', { id: 'tt-body' }, this.focusElement) as HTMLElement;
    this.tHeader = h('div', {
      id: 'tt-header',
      style: `height:${this.headerHeight}px`,
    }) as HTMLElement;
    this.tStation = h('div', { id: 'tt-station' }) as HTMLElement;
    this.element.append(this.tBody, this.tHeader, this.tStation);
    this.element.addEventListener('scroll', () => (this.rendering = true));
    this.element.addEventListener('click', event => {
      const target = event.target as HTMLElement;
      this.selectCell(...(target.dataset.address.split('-').map(value => Number(value)) as [number, number]));
    });
    // 現在の表示領域
    this.lastArea = { x: 0, w: 0 };
    this.columns = new Map();
    this.tStation.style.width = this.stationCellWidth + 'px';
    this.rendering = true;

    this.tHeader.style.width = this.app.data.railway.diagrams[this.diaIndex].trains[this.direction].length * this.cellWidth + 'px';
    this.tHeader.style.paddingLeft = this.stationCellWidth + 'px';

    this.loadStations();
    this.loadTrains();
    const task = () => {
      this.render();
      this.reqId = requestAnimationFrame(task);
    };
    task();
  }

  public finish() {
    cancelAnimationFrame(this.reqId);
  }

  public update() {
    this.loadTrains();
    this.tHeader.style.width = this.app.data.railway.diagrams[this.diaIndex].trains[this.direction].length * this.cellWidth + 'px';
    for (let i = this.lastArea.x; i <= this.lastArea.x + this.lastArea.w; i++) {
      this.reuseColumn(i, i, true);
    }
  }

  /**
   * 駅のdiv要素を生成して、駅毎の表示内容を調べますよ〜
   */
  private loadStations() {
    const stations = this.app.data.railway.stations;
    const len = stations.length;
    const stationFragment = document.createDocumentFragment();
    // 一駅ずつ見ていきますよ〜
    for (let i = 0; i < len; i++) {
      const station = stations[this.direction === 0 ? i : len - i - 1];
      const style = station.timetableStyle;
      const stationAppearance = {
        arrival: style.arrival[this.direction],
        border: false,
        departure: style.departure[this.direction],
      };
      if (this.direction === 0) {
        stationAppearance.border = station.border;
      } else if (i < len - 1) {
        stationAppearance.border = stations[len - i - 2].border;
      } else {
        stationAppearance.border = false;
      }
      // その駅は何行分かな？
      if (!style.arrival[this.direction] && !style.departure[this.direction]) continue;
      const div = h(
        'div',
        {
          class: 'tt-cell',
          style:
            `height: ${(Number(style.arrival[this.direction]) + Number(style.departure[this.direction])) * this.cellHeight}px;` +
            (stationAppearance.border ? `border-bottom: 1px solid #222222;` : '') +
            (station.isMain ? `font-weight: 500;` : ''),
        },
        station.name
      );
      stationFragment.appendChild(div);
      this.stationStyle.push(stationAppearance);
    }
    // さぁユーザーさんと顔合わせよ！
    this.tStation.appendChild(stationFragment);
  }
  /**
   * 列車の種別,行先,時刻を読み込む。表示はまだ。
   */
  private loadTrains() {
    const trainList = this.app.data.railway.diagrams[this.diaIndex].trains[this.direction];
    const stations = this.app.data.railway.stations;
    const stationLen = stations.length;
    this.sheet = [];
    let colIndex = 0;
    trainList.forEach((train: Train) => {
      const col = {
        number: train.number,
        type: this.app.data.railway.trainTypes[train.type],
        name: train.name,
        note: train.note,
        count: train.count,
        cells: [],
      };
      const trainType = this.app.data.railway.trainTypes[train.type];
      const color = trainType.textColor.toHEXString();
      const timetable = train.timetable;
      let rowIndex = 0;
      for (let i = 0; i < stationLen; i++) {
        // 時刻の配列
        const data = timetable.data[i];
        // 方向に応じた駅Index
        const sid = this.direction === 0 ? i : stationLen - i - 1;
        const { arrival, departure, border } = this.stationStyle[i];
        // データがなければ運行なし or 経由なし
        if (!data) {
          const isBlank = i < timetable.firstStationIndex || timetable.terminalStationIndex < i;
          if (arrival)
            col.cells.push({
              text: isBlank ? TABLE_MARK.blank : TABLE_MARK.nonroute,
              color,
              bg: i % 2 === 0,
              cellName: sid + '-arrival',
              address: colIndex + '-' + rowIndex++,
            });
          if (departure)
            col.cells.push({
              text: isBlank ? TABLE_MARK.blank : TABLE_MARK.nonroute,
              color,
              bg: i % 2 === 0,
              cellName: sid + '-departure',
              address: colIndex + '-' + rowIndex++,
            });
        } else if (data.stopType === 1) {
          // 着時刻
          if (arrival) {
            if (i !== 0 && timetable.data[i - 1] === null) {
              // 前駅が経由なしなら着時刻省略
              col.cells.push({
                text: TABLE_MARK.blank,
                color,
                bg: i % 2 === 0,
                cellName: sid + '-arrival',
                address: colIndex + '-' + rowIndex++,
              });
            } else if (i === timetable.firstStationIndex) {
              // 着時刻なく、始発駅でなければ発時刻を表示
              col.cells.push({
                text: TABLE_MARK.blank,
                color,
                bg: i % 2 === 0,
                cellName: sid + '-arrival',
                address: colIndex + '-' + rowIndex++,
              });
            } else {
              col.cells.push({
                text: numberToTimeString(data.arrival || data.departure, this.timeFormat),
                color,
                bg: i % 2 === 0,
                cellName: sid + '-arrival',
                address: colIndex + '-' + rowIndex++,
              });
            }
          }
          // 発時刻
          if (departure) {
            // 次駅が経由なしなら発時刻省略
            if (i !== stationLen - 1 && timetable.data[i + 1] === null) {
              col.cells.push({
                text: TABLE_MARK.blank,
                color,
                bg: i % 2 === 0,
                cellName: sid + '-departure',
                address: colIndex + '-' + rowIndex++,
              });
            } else if (data.departure !== null) {
              // 発時刻なく、着時刻の表示がなければ着時刻を表示
              col.cells.push({
                text: numberToTimeString(data.departure, this.timeFormat),
                color,
                bg: i % 2 === 0,
                cellName: sid + '-departure',
                address: colIndex + '-' + rowIndex++,
              });
            } else if (arrival && i !== timetable.terminalStationIndex) {
              col.cells.push({
                text: numberToTimeString(data.arrival, this.timeFormat),
                color,
                bg: i % 2 === 0,
                cellName: sid + '-departure',
                address: colIndex + '-' + rowIndex++,
              });
            } else if (i < timetable.firstStationIndex || timetable.terminalStationIndex <= i) {
              col.cells.push({
                text: TABLE_MARK.blank,
                color,
                bg: i % 2 === 0,
                cellName: sid + '-departure',
                address: colIndex + '-' + rowIndex++,
              });
            } else {
              col.cells.push({
                text: TABLE_MARK.stop,
                color,
                bg: i % 2 === 0,
                cellName: sid + '-departure',
                address: colIndex + '-' + rowIndex++,
              });
            }
          }
        } else if (data.stopType === 2) {
          if (arrival)
            col.cells.push({
              text: TABLE_MARK.pass,
              color,
              bg: i % 2 === 0,
              cellName: sid + '-departure',
              address: colIndex + '-' + rowIndex++,
            });
          if (departure)
            col.cells.push({
              text: TABLE_MARK.pass,
              color,
              bg: i % 2 === 0,
              cellName: sid + '-departure',
              address: colIndex + '-' + rowIndex++,
            });
        }
        col.cells[col.cells.length - 1].border = border;
      }
      this.sheet.push(col);
      colIndex++;
    });
  }
  /**
   * 描画部分。主にrequestAnimationFrameを通して呼ばれる。
   * スクロール量に応じて、列の更新処理を行う
   */
  private render() {
    if (!this.rendering) return;
    const viewArea = {
      x: Math.floor(this.element.scrollLeft / this.cellWidth),
      w: Math.ceil((this.element.offsetWidth - this.stationCellWidth) / this.cellWidth),
    };
    viewArea.x = Math.max(viewArea.x - 2, 0);
    viewArea.w = Math.min(viewArea.w + 4, this.sheet.length - viewArea.x - 1);

    // 再利用可能な(=画面外の)Column探し
    const reusableIndex: Set<number> = new Set();
    for (const key of this.columns.keys()) {
      if (key < viewArea.x || viewArea.x + viewArea.w < key) reusableIndex.add(key);
    }
    // 新たに必要なColumn探し
    for (let i = viewArea.x; i <= viewArea.x + viewArea.w; i++) {
      if (this.columns.has(i)) continue;
      if (reusableIndex.size !== 0) {
        const oldIndex = reusableIndex.values().next().value;
        reusableIndex.delete(oldIndex);
        this.reuseColumn(oldIndex, i, false);
      } else {
        this.createColumn(i);
      }
    }
    // Column過剰なら
    if (reusableIndex.size >= 5) {
      let count = 0;
      for (const i of reusableIndex) {
        if (count++ < 5) continue;
        this.deleteColumn(i);
      }
    }
    this.lastArea = viewArea;
  }

  private createColumn(colIndex: number) {
    const data = this.sheet[colIndex];
    let lastBg = null;
    const bodyContent = data.cells.map(
      ({
        text = '',
        color = '#000000',
        bg = false,
        border = false,
        cellName = '',
        address = '',
      }: {
        text: string;
        color: string;
        bg: boolean;
        border: boolean;
        cellName: string;
        address: string;
      }) => {
        const result = h(
          'div',
          {
            style:
              `color: ${color};height: ${this.cellHeight}px;` +
              (bg === lastBg ? 'border-top:1px solid rgba(0,0,0,0.1)' : '') +
              (border ? 'border-bottom:1px solid #444444' : ''),
            class: 'tt-cell' + (bg ? ' tt-cell-bg' : ''),
            'data-cell-name': cellName,
            'data-address': address,
          },
          text
        );
        lastBg = bg;
        return result;
      }
    );
    const body = h(
      'div',
      {
        class: 'tt-row',
        style: `transform: translateZ(0) translateX(${this.cellWidth * colIndex}px);top:${this.headerHeight}px;width:${this.cellWidth}px;`,
        'data-col-id': colIndex,
      },
      bodyContent
    ) as HTMLDivElement;
    const header = h(
      'div',
      {
        class: 'tt-head-row',
        style: `transform: translateZ(0) translateX(${this.cellWidth * colIndex}px);color: ${data.type.textColor.toHEXString()};width:${
          this.cellWidth
        }px;`,
        'data-col-id': colIndex,
      },
      [h('div', { class: 'tt-cell' }, data.number), h('div', { class: 'tt-cell' }, data.type.abbrName), h('div', { class: 'tt-cell' }, data.name)]
    ) as HTMLDivElement;
    this.tHeader.appendChild(header);
    this.tBody.appendChild(body);
    this.columns.set(colIndex, { header, body });
  }

  private reuseColumn(oldIdx: number, newIdx: number, forceUpdate: boolean) {
    const oldData = this.sheet[oldIdx];
    const newData = this.sheet[newIdx];
    const oldCol = this.columns.get(oldIdx);
    Array.from(oldCol.body.children).forEach((element: HTMLDivElement, i: number) => {
      if (oldData.cells[i].text !== newData.cells[i].text || forceUpdate) element.textContent = newData.cells[i].text;
      if (oldData.cells[i].color !== newData.cells[i].color || forceUpdate) element.style.color = newData.cells[i].color;
      if (oldData.cells[i].address !== newData.cells[i].address || forceUpdate) element.dataset.address = newData.cells[i].address;
    });
    oldCol.body.style.transform = 'translateZ(0) translateX(' + this.cellWidth * newIdx + 'px)';
    oldCol.body.dataset.colId = String(newIdx);
    if (oldData.number !== newData.number || forceUpdate) oldCol.header.children[0].textContent = newData.number;
    if (oldData.type.abbrName !== newData.type.abbrName || forceUpdate) oldCol.header.children[1].textContent = newData.type.abbrName;
    if (oldData.name !== newData.name || forceUpdate) oldCol.header.children[2].textContent = newData.name;
    if (oldData.type.textColor.toHEXString() !== newData.type.textColor.toHEXString() || forceUpdate)
      oldCol.header.style.color = newData.type.textColor.toHEXString();
    oldCol.header.style.transform = 'translateZ(0) translateX(' + this.cellWidth * newIdx + 'px)';
    oldCol.header.dataset.colId = String(newIdx);
    oldCol.header.classList[this.selectedCell.some(value => value.col === newIdx) ? 'add' : 'remove']('tt-weak-highlight');
    this.columns.delete(oldIdx);
    this.columns.set(newIdx, oldCol);
  }

  private deleteColumn(colIndex: number) {
    const { header, body } = this.columns.get(colIndex);
    this.tHeader.removeChild(header);
    this.tBody.removeChild(body);
    this.columns.delete(colIndex);
  }

  public keydown(e: KeyboardEvent) {
    if (37 <= e.keyCode && e.keyCode <= 40) {
      this.moveCell(e);
    } else if (e.keyCode === 13 && this.app.sub instanceof TrainSubview) {
      this.app.sub.focusField(this.getActiveCell().cellType);
    }
  }
  private moveCell(event: KeyboardEvent) {
    let { col, row } = this.getActiveCell();
    switch (event.keyCode) {
      case 37:
        col--;
        break;
      case 38:
        row--;
        break;
      case 39:
        col++;
        break;
      case 40:
        row++;
        break;
      default:
        return;
    }
    event.preventDefault();
    if (col < 0 || row < 0 || col >= this.sheet.length || row >= this.sheet[0].cells.length) return;
    let target = document.querySelector(`#tt-body>div>div[data-address="${col}-${row}"]`) as HTMLElement;
    if (target === null) {
      // セルが画面外にあって描画されていないとき
      if (col * this.cellWidth < this.element.scrollLeft) this.element.scrollLeft = col * this.cellWidth;
      if (this.element.scrollLeft + this.element.offsetWidth < col * this.cellWidth)
        this.element.scrollLeft = (col + 1) * this.cellWidth - this.element.offsetWidth;
      this.rendering = true;
      this.render();
      target = document.querySelector(`#tt-body>div>div[data-address="${col}-${row}"]`) as HTMLElement;
    }
    const targetRect = target.getBoundingClientRect();
    const containerRect = this.element.getBoundingClientRect();
    let dx = 0;
    let dy = 0;
    if (targetRect.left < containerRect.left + this.stationCellWidth) {
      dx = targetRect.left - this.stationCellWidth - containerRect.left;
    } else if (targetRect.left + targetRect.width > containerRect.left + containerRect.width) {
      dx = targetRect.left + targetRect.width - containerRect.left - containerRect.width;
    }
    if (targetRect.top < containerRect.top + this.headerHeight) {
      dy = targetRect.top - this.headerHeight - containerRect.top;
    } else if (targetRect.top + targetRect.height > containerRect.top + containerRect.height) {
      dy = targetRect.top + targetRect.height - containerRect.top - containerRect.height;
    }
    this.element.scrollBy(dx, dy);
    this.selectCell(col, row);
  }
  private appendTrain() {
    const trainList = this.app.data.railway.diagrams[this.diaIndex].trains[this.direction];
    trainList.push(new Train());
    this.update();
  }
  private insertTrain(index: number) {
    const trainList = this.app.data.railway.diagrams[this.diaIndex].trains[this.direction];
    trainList.splice(index, 0, new Train());
    this.update();
  }
  private selectCell(col, row, additional = false) {
    const target = document.querySelector(`[data-address="${col}-${row}"]`) as HTMLElement;
    const [stationIndexString, cellType] = target.dataset.cellName.split('-');
    const stationIndex = Number(stationIndexString);
    if (!additional) {
      this.selectedCell = [{ col, row, stationIndex, cellType }];
    } else if (!this.selectedCell.some(value => value[0] === col && value[1] === row)) {
      this.selectedCell.push({ col, row, stationIndex, cellType });
    } else {
      return;
    }
    this.columns.forEach(({ header }, key) => {
      header.classList[this.selectedCell.some(value => value.col === key) ? 'add' : 'remove']('tt-weak-highlight');
    });
    Array.from(this.tStation.children).forEach((element, i) => {
      element.classList[
        i == (this.direction === 0 ? stationIndex : this.app.data.railway.stations.length - Number(stationIndex) - 1) ? 'add' : 'remove'
      ]('tt-weak-highlight');
    });
    const rect = target.getBoundingClientRect();
    const rect2 = this.tBody.getBoundingClientRect();
    this.focusElement.style.left = rect.left - rect2.left - 2 + 'px';
    this.focusElement.style.top = rect.top - rect2.top - 2 + 'px';
    this.focusElement.style.width = rect.width - rect2.width + 'px';
    this.focusElement.style.height = rect.height - rect2.height + 'px';
    if (this.selectedCell.length === 1 && this.app.sub instanceof TrainSubview)
      this.app.sub.showStationTime({
        stationIndex,
        direction: this.direction,
        train: this.app.data.railway.diagrams[this.diaIndex].trains[this.direction][col],
      });
  }
  private getActiveCell() {
    const cell = this.selectedCell[this.selectedCell.length - 1];
    return cell || { col: 0, row: 0, cellType: 'departure', stationIndex: 0 };
  }
}
