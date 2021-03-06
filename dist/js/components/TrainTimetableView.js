import { Train } from '../DiagramParser.js';
import { h, numberToTimeString, Menu } from '../Util.js';
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
    /**
     * @param app
     * @param diaIndex Diagramの添字
     * @param direction 下り0, 上り1
     * @param trainId 表示する
     */
    constructor(app, diaIndex, direction, trainId, stationId) {
        const trainMenu = [
            {
                label: '列車を左に挿入',
                accelerator: 'Alt+Left',
                click: () => this.insertTrain(this.getActiveCell().col),
            },
            {
                label: '列車を右に挿入',
                accelerator: 'Alt+Right',
                click: () => this.insertTrain(this.getActiveCell().col + 1),
            },
            {
                label: '列車を複製',
                accelerator: 'CmdOrCtrl+D',
                click: () => this.cloneTrain(this.getActiveCell().col),
            },
            {
                label: '列車を削除',
                accelerator: 'CmdOrCtrl+Backspace',
                click: () => this.removeTrain(this.getActiveCell().col),
            },
        ];
        const stationMenu = [
            {
                label: '停車',
                accelerator: 'S',
                click: () => this.changeStopType(this.getActiveCell(), 1, this.direction),
            },
            {
                label: '通過',
                accelerator: 'D',
                click: () => this.changeStopType(this.getActiveCell(), 2, this.direction),
            },
            {
                label: '運行なし',
                accelerator: 'F',
                click: () => this.changeStopType(this.getActiveCell(), 3, this.direction),
            },
            {
                label: '時刻を消去',
                accelerator: 'Backspace',
                click: () => this.eraceTime(this.getActiveCell(), this.direction),
            },
            { type: 'separator' },
            {
                label: '駅時刻表で表示',
                click: () => this.viewInStationTimetableView(),
            },
            { label: 'ダイヤグラムで表示', click: () => this.viewInDiagramView() },
        ];
        super(app, direction === 0 ? 'OutboundTrainTimetable' : 'InboundTrainTimetable', [
            {
                label: '列車',
                submenu: trainMenu,
            },
            {
                label: '駅時刻',
                submenu: stationMenu,
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
        this.focusElement = h('div', { id: 'tt-focus' });
        this.tBody = h('div', { id: 'tt-body' }, this.focusElement);
        this.tHeader = h('div', {
            id: 'tt-header',
            style: `height:${this.headerHeight}px`,
        });
        this.tStation = h('div', { id: 'tt-station' });
        // this.noTrainDialog = h('div', { id: 'tt-noTrain' }, '列車がありません') as HTMLDivElement
        this.noTrainDialog = h('div', { id: 'tt-noTrainButton', class: 'form-button' }, '＋列車を追加', () => this.insertTrain(0));
        this.element.append(this.tBody, this.tHeader, this.tStation, this.noTrainDialog);
        this.element.addEventListener('scroll', () => (this.rendering = true));
        const selectByClick = (event) => {
            const target = event.target;
            if (!target.classList.contains('tt-cell') || !target.dataset.address)
                return;
            this.selectCell(...target.dataset.address.split('-').map(value => Number(value)), 
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            event.shiftKey ? 'toggle' : 'select');
        };
        this.element.addEventListener('click', event => {
            selectByClick(event);
        });
        this.element.addEventListener('contextmenu', event => {
            selectByClick(event);
            new Menu([...stationMenu, { type: 'separator' }, ...trainMenu]).popup({
                x: event.clientX,
                y: event.clientY,
            });
            event.preventDefault();
        });
        // 現在の表示領域
        this.lastArea = { x: 0, w: 0 };
        this.columns = new Map();
        this.selectedCell = [];
        this.tStation.style.width = this.stationCellWidth + 'px';
        this.rendering = true;
        this.tHeader.style.width =
            this.app.data.railway.diagrams[this.diaIndex].trains[this.direction].length * this.cellWidth + 'px';
        this.tHeader.style.paddingLeft = this.stationCellWidth + 'px';
        this.loadStations();
        this.loadTrains();
        this.jumpToCell({ col: trainId, stationId: stationId });
        const task = () => {
            this.render();
            this.reqId = requestAnimationFrame(task);
        };
        task();
    }
    finish() {
        cancelAnimationFrame(this.reqId);
    }
    update() {
        this.loadTrains();
        const trains = this.app.data.railway.diagrams[this.diaIndex].trains[this.direction];
        this.tHeader.style.width = trains.length * this.cellWidth + 'px';
        for (let i = this.lastArea.x; i <= this.lastArea.x + this.lastArea.w; i++) {
            this.reuseColumn(i, i, true);
        }
    }
    /**
     * 駅のdiv要素を生成して、駅毎の表示内容を調べますよ〜
     */
    loadStations() {
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
            if (i === len - 1) {
                stationAppearance.border = false;
            }
            else if (this.direction === 0) {
                stationAppearance.border = station.border;
            }
            else {
                stationAppearance.border = stations[len - i - 2].border;
            }
            // その駅は何行分かな？
            if (!style.arrival[this.direction] && !style.departure[this.direction])
                continue;
            const div = h('div', {
                class: 'tt-cell',
                style: `height: ${(Number(style.arrival[this.direction]) + Number(style.departure[this.direction])) *
                    this.cellHeight}px;` +
                    (stationAppearance.border && i !== len - 1 ? `border-bottom: 1px solid #222222;` : '') +
                    (station.isMain ? `font-weight: 500;` : ''),
            }, station.name);
            stationFragment.appendChild(div);
            this.stationStyle.push(stationAppearance);
        }
        // さぁユーザーさんと顔合わせよ！
        this.tStation.appendChild(stationFragment);
    }
    /**
     * 列車の種別,行先,時刻を読み込む。表示はまだ。
     * 「列車無し」の表じだけ更新
     */
    loadTrains() {
        const trainList = this.app.data.railway.diagrams[this.diaIndex].trains[this.direction];
        const stations = this.app.data.railway.stations;
        const stationLen = stations.length;
        this.sheet = [];
        let colIndex = 0;
        this.noTrainDialog.classList[trainList.length === 0 ? 'add' : 'remove']('show');
        trainList.forEach((train) => {
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
                if (arrival) {
                    let text = '';
                    if (i < timetable.firstStationIndex || timetable.terminalStationIndex < i) {
                        // 走行範囲外 -> 運行なし
                        text = TABLE_MARK.blank;
                    }
                    else if (!data) {
                        // 時刻なし -> 経由なし
                        text = TABLE_MARK.nonroute;
                    }
                    else if (departure && !(i - 1 in timetable.data) && i !== timetable.terminalStationIndex) {
                        // 省略対象セルに入力しても何も見えないんじゃ入れてる気にならなそう。UX悪そう
                        // 発表示ありで前駅が経由なしで終着駅ではない -> 着時刻省略
                        text = i === timetable.firstStationIndex ? TABLE_MARK.blank : TABLE_MARK.nonroute;
                    }
                    else if (data.stopType == 2) {
                        // 通過 -> 通過
                        text = TABLE_MARK.pass;
                    }
                    else if (data.arrival !== null || data.departure !== null) {
                        // 時刻データあり -> 着時刻 (なければ発時刻)
                        text = numberToTimeString((data.arrival || data.departure), this.timeFormat);
                    }
                    else {
                        // 着時刻,発時刻共にデータ無し -> 停車記号
                        text = TABLE_MARK.stop;
                    }
                    col.cells.push({
                        text,
                        color,
                        bg: i % 2 === 0,
                        cellName: sid + '-arrival',
                        address: colIndex + '-' + rowIndex++,
                        border: false,
                    });
                }
                if (departure) {
                    let text = '';
                    if (i < timetable.firstStationIndex || timetable.terminalStationIndex < i) {
                        // 走行範囲外 -> 運行なし
                        text = TABLE_MARK.blank;
                    }
                    else if (!data) {
                        // 時刻なし -> 経由なし
                        text = TABLE_MARK.nonroute;
                    }
                    else if (data.stopType == 2) {
                        // 通過 -> 通過
                        text = TABLE_MARK.pass;
                    }
                    else if (arrival && !(i + 1 in timetable.data) && i !== timetable.firstStationIndex) {
                        // 省略対象セルに入力しても何も見えないんじゃ入れてる気にならなそう。UX悪そう
                        // 着表示ありで次駅が経由なしで始発駅でない -> 着時刻省略
                        text = i === timetable.terminalStationIndex ? TABLE_MARK.blank : TABLE_MARK.nonroute;
                    }
                    else if (data.departure !== null || data.arrival !== null) {
                        // 時刻データあり -> 発時刻 (なければ着時刻)
                        text = numberToTimeString((data.departure || data.arrival), this.timeFormat);
                    }
                    else {
                        // 着時刻,発時刻共にデータ無し -> 停車記号
                        text = TABLE_MARK.stop;
                    }
                    col.cells.push({
                        text,
                        color,
                        bg: i % 2 === 0,
                        cellName: sid + '-departure',
                        address: colIndex + '-' + rowIndex++,
                        border: false,
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
    render() {
        if (!this.rendering)
            return;
        const viewArea = {
            x: Math.floor(this.element.scrollLeft / this.cellWidth),
            w: Math.ceil((this.element.offsetWidth - this.stationCellWidth) / this.cellWidth),
        };
        viewArea.x = Math.max(viewArea.x - 2, 0);
        viewArea.w = Math.min(viewArea.w + 4, this.sheet.length - viewArea.x - 1);
        // 再利用可能な(=画面外の)Column探し
        const reusableIndex = new Set();
        for (const key of this.columns.keys()) {
            if (key < viewArea.x || viewArea.x + viewArea.w < key)
                reusableIndex.add(key);
        }
        // 新たに必要なColumn探し
        for (let i = viewArea.x; i <= viewArea.x + viewArea.w; i++) {
            if (this.columns.has(i))
                continue;
            if (reusableIndex.size !== 0) {
                const oldIndex = reusableIndex.values().next().value;
                reusableIndex.delete(oldIndex);
                this.reuseColumn(oldIndex, i, false);
            }
            else {
                this.createColumn(i);
            }
        }
        // Column過剰なら
        if (reusableIndex.size >= 5) {
            let count = 0;
            for (const i of reusableIndex) {
                if (count++ < 5)
                    continue;
                this.deleteColumn(i);
            }
        }
        this.lastArea = viewArea;
    }
    createColumn(colIndex) {
        const data = this.sheet[colIndex];
        let lastBg = false;
        const bodyContent = data.cells.map(({ text = '', color = '#000000', bg = false, border = false, cellName = '', address = '', }) => {
            const result = h('div', {
                style: `color: ${color};height: ${this.cellHeight}px;` +
                    (bg === lastBg ? 'border-top:1px solid rgba(0,0,0,0.1)' : '') +
                    (border ? 'border-bottom:1px solid #444444' : ''),
                class: 'tt-cell' + (bg ? ' tt-cell-bg' : ''),
                'data-cell-name': cellName,
                'data-address': address,
            }, text);
            lastBg = bg;
            return result;
        });
        const body = h('div', {
            class: 'tt-row',
            style: `transform: translateZ(0) translateX(${this.cellWidth * colIndex}px);top:${this.headerHeight}px;width:${this.cellWidth}px;`,
            'data-col-id': colIndex,
        }, bodyContent);
        const header = h('div', {
            class: 'tt-head-row',
            style: `transform: translateZ(0) translateX(${this.cellWidth *
                colIndex}px);color: ${data.type.textColor.toHEXString()};width:${this.cellWidth}px;`,
            'data-col-id': colIndex,
        }, [
            h('div', { class: 'tt-cell' }, data.number),
            h('div', { class: 'tt-cell' }, data.type.abbrName),
            h('div', { class: 'tt-cell' }, data.name),
        ]);
        this.tHeader.appendChild(header);
        this.tBody.appendChild(body);
        this.columns.set(colIndex, { header, body });
    }
    reuseColumn(oldIdx, newIdx, forceUpdate) {
        const oldCol = this.columns.get(oldIdx);
        if (!(newIdx in this.sheet)) {
            this.deleteColumn(oldIdx);
            return;
        }
        const oldData = this.sheet[oldIdx];
        const newData = this.sheet[newIdx];
        Array.from(oldCol.body.children).forEach((element, i) => {
            if (oldData.cells[i].text !== newData.cells[i].text || forceUpdate)
                element.textContent = newData.cells[i].text;
            if (oldData.cells[i].color !== newData.cells[i].color || forceUpdate)
                element.style.color = newData.cells[i].color;
            if (oldData.cells[i].address !== newData.cells[i].address || forceUpdate)
                element.dataset.address = newData.cells[i].address;
        });
        oldCol.body.style.transform = 'translateZ(0) translateX(' + this.cellWidth * newIdx + 'px)';
        oldCol.body.dataset.colId = String(newIdx);
        if (oldData.number !== newData.number || forceUpdate)
            oldCol.header.children[0].textContent = newData.number;
        if (oldData.type.abbrName !== newData.type.abbrName || forceUpdate)
            oldCol.header.children[1].textContent = newData.type.abbrName;
        if (oldData.name !== newData.name || forceUpdate)
            oldCol.header.children[2].textContent = newData.name;
        if (oldData.type.textColor.toHEXString() !== newData.type.textColor.toHEXString() || forceUpdate)
            oldCol.header.style.color = newData.type.textColor.toHEXString();
        oldCol.header.style.transform = 'translateZ(0) translateX(' + this.cellWidth * newIdx + 'px)';
        oldCol.header.dataset.colId = String(newIdx);
        oldCol.header.classList[this.selectedCell.some(value => value.col === newIdx) ? 'add' : 'remove']('tt-weak-highlight');
        this.columns.delete(oldIdx);
        this.columns.set(newIdx, oldCol);
    }
    deleteColumn(colIndex) {
        if (!this.columns.has(colIndex))
            return;
        const { header, body } = this.columns.get(colIndex);
        this.tHeader.removeChild(header);
        this.tBody.removeChild(body);
        this.columns.delete(colIndex);
    }
    keydown(e) {
        if (37 <= e.keyCode && e.keyCode <= 40) {
            // 方向キー
            this.moveCell(e);
        }
        else if (e.keyCode === 13) {
            // Enter
            ;
            this.app.sub.focusField(this.getActiveCell().cellType);
        }
    }
    changeStopType(cell, type, direction) {
        const timetable = this.app.data.railway.diagrams[this.diaIndex].trains[this.direction][cell.col].timetable;
        const stationIndex = direction === 0 ? cell.stationIndex : this.app.data.railway.stations.length - cell.stationIndex - 1;
        if (!(stationIndex in timetable.data)) {
            timetable.data[stationIndex] = {
                arrival: null,
                departure: null,
                stopType: type,
                track: null,
            };
        }
        else {
            if (timetable.data[stationIndex].stopType === type)
                return;
            timetable.data[stationIndex].stopType = type;
        }
        timetable.update();
        this.update();
        if (this.app.sub instanceof TrainSubview)
            this.app.sub.update();
    }
    moveCell(event) {
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
        if (col < 0 || row < 0 || col >= this.sheet.length || row >= this.sheet[0].cells.length)
            return;
        let target = document.querySelector(`#tt-body>div>div[data-address="${col}-${row}"]`);
        if (target === null) {
            // セルが画面外にあって描画されていないとき
            if (col * this.cellWidth < this.element.scrollLeft)
                this.element.scrollLeft = col * this.cellWidth;
            if (this.element.scrollLeft + this.element.offsetWidth < col * this.cellWidth)
                this.element.scrollLeft = (col + 1) * this.cellWidth - this.element.offsetWidth;
            this.rendering = true;
            this.render();
            target = document.querySelector(`#tt-body>div>div[data-address="${col}-${row}"]`);
        }
        const targetRect = target.getBoundingClientRect();
        const containerRect = this.element.getBoundingClientRect();
        let dx = 0;
        let dy = 0;
        if (targetRect.left < containerRect.left + this.stationCellWidth) {
            dx = targetRect.left - this.stationCellWidth - containerRect.left;
        }
        else if (targetRect.left + targetRect.width > containerRect.left + containerRect.width) {
            dx = targetRect.left + targetRect.width - containerRect.left - containerRect.width;
        }
        if (targetRect.top < containerRect.top + this.headerHeight) {
            dy = targetRect.top - this.headerHeight - containerRect.top;
        }
        else if (targetRect.top + targetRect.height > containerRect.top + containerRect.height) {
            dy = targetRect.top + targetRect.height - containerRect.top - containerRect.height;
        }
        this.element.scrollBy(dx, dy);
        this.selectCell(col, row);
    }
    removeTrain(index) {
        const trainList = this.app.data.railway.diagrams[this.diaIndex].trains[this.direction];
        trainList.splice(index, 1);
        this.update();
        if (index >= trainList.length) {
            this.selectCell(trainList.length - 1, this.getActiveCell().row);
        }
        else {
            this.selectCell(index, this.getActiveCell().row);
        }
    }
    insertTrain(index) {
        const trainList = this.app.data.railway.diagrams[this.diaIndex].trains[this.direction];
        const train = new Train();
        train.direction = this.direction;
        trainList.splice(index, 0, train);
        this.rendering = true;
        this.render();
        this.update();
        requestAnimationFrame(() => this.selectCell(index, this.getActiveCell().row));
    }
    cloneTrain(index) {
        const trainList = this.app.data.railway.diagrams[this.diaIndex].trains[this.direction];
        const train = trainList[index].clone();
        trainList.splice(index + 1, 0, train);
        this.rendering = true;
        this.render();
        this.update();
        requestAnimationFrame(() => this.selectCell(index + 1, this.getActiveCell().row));
    }
    jumpToCell({ col, stationId }) {
        const viewWidth = this.element.offsetWidth;
        this.element.scrollLeft = (col - 0.5) * this.cellWidth - viewWidth / 2;
        this.rendering = true;
        this.render();
        const a = document.querySelector(`#tt-body>[data-col-id="${col}"]>div[data-cell-name="${stationId}-departure"]`);
        const b = document.querySelector(`#tt-body>[data-col-id="${col}"]>div[data-cell-name="${stationId}-arrival"]`);
        const target = (a || b);
        if (!target || !target.dataset.address)
            return;
        this.selectCell(col, Number(target.dataset.address.split('-')[1]), 'select');
    }
    selectCell(col, row, mode = 'select') {
        const target = document.querySelector(`[data-address="${col}-${row}"]`);
        if (!target || !target.dataset.cellName) {
            this.selectedCell = [];
            this.focusElement.style.top = '-99px';
            if (this.app.sub instanceof TrainSubview)
                this.app.sub.showStationTime(null);
            return;
        }
        const [stationIndexString, cellType] = target.dataset.cellName.split('-');
        const stationIndex = Number(stationIndexString);
        const isExist = this.selectedCell.some(value => value[0] === col && value[1] === row);
        if (mode === 'select') {
            this.selectedCell = [{ col, row, stationIndex, cellType }];
        }
        else if (mode === 'adding' || (mode === 'toggle' && !isExist)) {
            this.selectedCell.push({ col, row, stationIndex, cellType });
        }
        else if (mode === 'deleting' || (mode === 'toggle' && isExist)) {
            //elseだけでいいような...
            this.selectedCell = this.selectedCell.filter(obj => obj.col !== col || obj.row !== row || obj.stationIndex !== stationIndex || obj.cellType !== cellType);
        }
        this.columns.forEach(({ header }, key) => {
            header.classList[this.selectedCell.some(value => value.col === key) ? 'add' : 'remove']('tt-weak-highlight');
        });
        Array.from(this.tStation.children).forEach((element, i) => {
            element.classList[this.selectedCell.some(value => i ==
                (this.direction === 0
                    ? value.stationIndex
                    : this.app.data.railway.stations.length - Number(value.stationIndex) - 1))
                ? 'add'
                : 'remove']('tt-weak-highlight');
        });
        const rect = this.tBody.getBoundingClientRect();
        this.focusElement.style.left = col * this.cellWidth - 1 + 'px';
        this.focusElement.style.top = this.headerHeight + row * this.cellHeight - 2 + 'px';
        this.focusElement.style.width = this.cellWidth - rect.width - 1 + 'px';
        this.focusElement.style.height = this.cellHeight - rect.height + 'px';
        if (this.selectedCell.length === 1 && this.app.sub instanceof TrainSubview)
            this.app.sub.showStationTime({
                stationIndex,
                direction: this.direction,
                train: this.app.data.railway.diagrams[this.diaIndex].trains[this.direction][col],
            });
    }
    eraceTime(cell, direction) {
        const timetable = this.app.data.railway.diagrams[this.diaIndex].trains[this.direction][cell.col].timetable;
        const stationIndex = direction === 0 ? cell.stationIndex : this.app.data.railway.stations.length - cell.stationIndex - 1;
        if (!(stationIndex in timetable.data))
            return;
        timetable.data[stationIndex].arrival = null;
        timetable.data[stationIndex].departure = null;
        timetable.update();
        this.update();
        if (this.app.sub instanceof TrainSubview)
            this.app.sub.update();
    }
    getActiveCell() {
        const cell = this.selectedCell[this.selectedCell.length - 1];
        return cell || { col: 0, row: 0, cellType: 'departure', stationIndex: 0 };
    }
    viewInStationTimetableView() {
        const cell = this.getActiveCell();
        this.app.showStationTimetableView(this.diaIndex, this.direction, cell.col, cell.stationIndex);
    }
    viewInDiagramView() {
        const cell = this.getActiveCell();
        this.app.showDiagramView(this.diaIndex, this.direction, cell.col, cell.stationIndex);
    }
}
//# sourceMappingURL=TrainTimetableView.js.map