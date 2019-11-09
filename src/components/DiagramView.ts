import App from '../App.js'
import { Station, Train } from '../DiagramParser.js'
import { DASH_ARRAY_STYLE, getDistance2, h, numberToTimeString, Menu } from '../Util.js'
import View from './View.js'
import TrainSubview from './TrainSubview.js'
type drawingDataItem = Array<{
  path: Array<number | boolean>
  color: string
  strokeStyle: string
  bold: boolean
  trainNumber: string
  trainName: string
}>

// CanvasDiagramView.js (module)
// ダイヤグラムを表示する。斜め線いっぱいのやつ。
// より高速化を目指しCanvasで書き直します！1から？いいえ0から！
export default class CanvasDiagramView extends View {
  /**
   * window.devicePixelRatioの値。高解像度端末への対応
   */
  private devicePixelRatio: number
  /**
   * 何番目のダイヤか
   */
  private diaIndex: number
  /**
   * 駅。下り方向の順
   */
  private stations: Station[]
  /**
   * 上り列車の配列
   */
  private inboundTrains: Train[]
  /**
   * 下り列車の配列
   */
  private outboundTrains: Train[]
  /**
   * 水平方向の拡大率
   */
  private xScale: number
  /**
   * 垂直方向の拡大率
   */
  private yScale: number
  private minXScale: number
  private minYScale: number
  private maxXScale: number
  private maxYScale: number
  /**
   * animation用の予定拡大率の配列
   */
  private reservedScale: Array<[number, number, number, number]>
  /**
   * height of header(time)
   */
  private paddingTop: number
  /**
   * width of station name area
   */
  private paddingLeft: number

  private visibleInbound: boolean
  private visibleOutbound: boolean
  private visibleTrainNumber: boolean
  private visibleTrainName: boolean
  /**
   * trueにすると次のanimationFrameで再描画される。(スクロールと倍率変更の時は不要)
   */
  private forceDraw: boolean
  /**
   * カーソル位置
   */
  private pointerPosition: { x: number; y: number }
  /**
   * 最後の描画以降にマウスカーソルの移動があったか
   */
  private pointerMoved: boolean
  /**
   * 描画の開始時刻。1日の始まりは4時から。
   */
  private startTime: number
  private lastPosition: { x: number; y: number; w: number; h: number }
  private isScaling: boolean
  private canvasWrapper: HTMLElement
  private canvas: HTMLCanvasElement
  private context: CanvasRenderingContext2D
  private pinchStart: {
    x0: number
    y0: number
    dx: number
    dy: number
    xScale: number
    yScale: number
    px: number
    py: number
  }
  private stationDistance: number[]
  private drawingData: {
    totalDistance: number[]
    outbound: drawingDataItem
    inbound: drawingDataItem
  }
  private reqId: number
  private hoveredTrain: {
    direction: number
    trainIndex: number
    diaIndex: number
  }
  private selectedTrain: {
    direction: 0 | 1
    trainIndex: number
    diaIndex: number
    stationIndex: number
  }
  private dgViewWrapper: HTMLElement
  /**
   *
   */
  constructor(app: App, diaIndex: number, direction: 0 | 1, trainId: number, stationId: number) {
    super(app, 'Diagram')
    this.devicePixelRatio = window.devicePixelRatio // そのうち低解像度にする設定でもつける？ iPad mini2だとキツイ。ここを下げるだけ
    this.diaIndex = diaIndex
    // 利用するデータ群
    this.stations = this.app.data.railway.stations
    this.outboundTrains = this.app.data.railway.diagrams[diaIndex].trains[0]
    this.inboundTrains = this.app.data.railway.diagrams[diaIndex].trains[1]
    if (this.stations.length === 0) {
      this.showNoData()
      return
    }
    // 表示設定
    this.xScale = 10 * this.devicePixelRatio
    this.yScale = 20 * this.devicePixelRatio
    this.minXScale = 1.5 * this.devicePixelRatio
    this.minYScale = 5.0 * this.devicePixelRatio
    this.maxXScale = 35 * this.devicePixelRatio
    this.maxYScale = 35 * this.devicePixelRatio
    this.reservedScale = []
    this.paddingTop = 16 * this.devicePixelRatio
    this.paddingLeft = 80 * this.devicePixelRatio
    this.visibleInbound = true
    this.visibleOutbound = true
    this.visibleTrainNumber = true
    this.visibleTrainName = false
    this.hoveredTrain = null
    this.selectedTrain = null
    this.forceDraw = false
    this.pinchStart = null
    this.pointerPosition = { x: 0, y: 0 }
    this.pointerMoved = false
    this.reqId = null
    this.startTime = 4 * 60 * 60
    this.stationDistance = this.getStationDistanceArray()
    this.drawingData = this.calcDrawingData()
    this.lastPosition = { x: -100, y: -100, w: 1, h: 1 }
    this.isScaling = false

    this.element.classList.add('no-bg')
    // 右下(ボタン群)
    const toolContainer = h('div', { id: 'dg-tools' }, [
      h('div', { id: 'dg-tools-container1', class: 'dg-tools-container' }, [
        h(
          'div',
          { id: 'dg-tools-zoomin', class: 'dg-tools-button' },
          h('img', { class: 'dg-tools-svgicon', src: 'img/plus.svg' }),
          e => {
            e.stopPropagation()
            this.scale(this.xScale * 1.5, this.yScale * 1.5, true)
          }
        ),
        h(
          'div',
          { id: 'dg-tools-zoomout', class: 'dg-tools-button' },
          h('img', { class: 'dg-tools-svgicon', src: 'img/minus.svg' }),
          e => {
            e.stopPropagation()
            this.scale(this.xScale / 1.5, this.yScale / 1.5, true)
          }
        ),
      ]),
      h('div', { id: 'dg-tools-container3', class: 'dg-tools-container' }, [
        h('label', { class: 'dg-tools-button' }, [
          h('input', { class: 'dg-tools-input', type: 'checkbox', checked: 'checked' }, null, e => {
            e.stopPropagation()
            this.visibleTrainNumber = !this.visibleTrainNumber
            this.forceDraw = true
          }),
          h('img', { class: 'dg-tools-svgicon', src: 'img/trainNumber.svg' }),
        ]),
        h('label', { class: 'dg-tools-button dg-tools-button-rightMargin' }, [
          h('input', { class: 'dg-tools-input', type: 'checkbox' }, null, e => {
            e.stopPropagation()
            this.visibleTrainName = !this.visibleTrainName
            this.forceDraw = true
          }),
          h('img', { class: 'dg-tools-svgicon', src: 'img/trainName.svg' }),
        ]),
        h(
          'label',
          { class: 'dg-tools-button' },
          [
            h('input', {
              class: 'dg-tools-input',
              name: 'dg-tools-direction',
              type: 'radio',
            }),
            h('img', { class: 'dg-tools-svgicon', src: 'img/inbound.svg' }),
          ],
          e => {
            e.stopPropagation()
            this.visibleOutbound = false
            this.visibleInbound = true
            this.forceDraw = true
          }
        ),
        h(
          'label',
          { class: 'dg-tools-button' },
          [
            h('input', {
              class: 'dg-tools-input',
              name: 'dg-tools-direction',
              type: 'radio',
              checked: 'checked',
            }),
            h('img', {
              class: 'dg-tools-svgicon',
              src: 'img/both_directions.svg',
            }),
          ],
          e => {
            e.stopPropagation()
            this.visibleOutbound = true
            this.visibleInbound = true
            this.forceDraw = true
          }
        ),
        h(
          'label',
          { class: 'dg-tools-button dg-tools-button-rightMargin' },
          [
            h('input', {
              class: 'dg-tools-input',
              name: 'dg-tools-direction',
              type: 'radio',
            }),
            h('img', { class: 'dg-tools-svgicon', src: 'img/outbound.svg' }),
          ],
          e => {
            e.stopPropagation()
            this.visibleOutbound = true
            this.visibleInbound = false
            this.forceDraw = true
          }
        ),
        h(
          'div',
          { id: 'dg-tools-narrow', class: 'dg-tools-button' },
          h('img', { class: 'dg-tools-svgicon', src: 'img/narrow.svg' }),
          e => {
            e.stopPropagation()
            this.scale(this.xScale / 1.25, this.yScale, true)
          }
        ),
        h(
          'div',
          { id: 'dg-tools-widen', class: 'dg-tools-button' },
          h('img', { class: 'dg-tools-svgicon', src: 'img/widen.svg' }),
          e => {
            e.stopPropagation()
            this.scale(this.xScale * 1.25, this.yScale, true)
          }
        ),
      ]),
    ])
    this.canvasWrapper = h('div', { id: 'dg-canvasWrapper' }) as HTMLDivElement
    this.canvas = h('canvas', { id: 'dg-canvas' }) as HTMLCanvasElement
    this.canvas.style.transform = `scale(${1 / this.devicePixelRatio})`
    this.canvas.width = this.element.offsetWidth * this.devicePixelRatio
    this.canvas.height = this.element.offsetHeight * this.devicePixelRatio
    this.context = this.canvas.getContext('2d', { alpha: false })
    this.canvasWrapper.appendChild(this.canvas)

    if ('ontouchstart' in document && 'orientation' in window) {
      this.element.addEventListener('touchstart', e => this.touchstart(e), true)
      this.element.addEventListener('touchmove', e => this.pinchScaling(e), false)
      this.element.addEventListener('touchend', () => this.pinchEnd(), false)
      this.element.addEventListener('touchend', e => {
        const rect = (e.currentTarget as Element).getBoundingClientRect()
        this.pointerPosition = {
          x: e.changedTouches[0].clientX - rect.left,
          y: e.changedTouches[0].clientY - rect.top,
        }
        this.pointerMoved = true
        this.forceDraw = true
      })
    } else {
      this.element.addEventListener('mousemove', e => {
        this.pointerPosition = { x: e.offsetX, y: e.offsetY }
        this.pointerMoved = true
        this.forceDraw = true
      })
      this.element.addEventListener('click', e => {
        this.selectedTrain = this.getTrainByCoordinate({
          x: e.offsetX,
          y: e.offsetY,
        })
        if (this.selectedTrain === null) return
        const { direction, trainIndex, stationIndex } = this.selectedTrain
        if (this.app.sub instanceof TrainSubview) {
          this.app.sub.showStationTime({
            stationIndex,
            direction,
            train: this.app.data.railway.diagrams[this.diaIndex].trains[direction][trainIndex],
          })
        }
      })
      this.element.addEventListener('contextmenu', (event: MouseEvent) => {
        this.selectedTrain = this.getTrainByCoordinate({
          x: event.offsetX,
          y: event.offsetY,
        })
        if (this.selectedTrain === null) return
        const { direction, trainIndex, stationIndex } = this.selectedTrain
        new Menu([
          {
            label: '列車時刻表で表示',
            click: () => this.viewInTrainTimetableView(trainIndex, direction, stationIndex),
          },
          {
            label: '駅時刻表で表示',
            click: () => this.viewInStationTimetableView(trainIndex, direction, stationIndex),
          },
        ]).popup({ x: event.clientX, y: event.clientY })
        event.preventDefault()
      })
    }
    this.dgViewWrapper = h('div', { id: 'dg-wrapper' }, this.canvasWrapper) as HTMLElement
    this.element.append(toolContainer, this.dgViewWrapper)
    this.scale(10, 20)
    this.draw()
    if (stationId !== null && trainId !== null) {
      this.selectedTrain = {
        direction,
        diaIndex,
        stationIndex: stationId,
        trainIndex: trainId,
      }
      const time = this.app.data.railway.diagrams[this.selectedTrain.diaIndex].trains[this.selectedTrain.direction][
        this.selectedTrain.trainIndex
      ].timetable.data[stationId]
      this.dgViewWrapper.scrollTo(
        this.getRelativeTime(time.departure || time.arrival) * this.xScale - this.element.offsetWidth / 2,
        this.drawingData.totalDistance[stationId] * this.yScale - this.element.offsetHeight / 2
      )
    }
  }
  public finish() {
    if (this.reqId !== null) {
      cancelAnimationFrame(this.reqId)
      this.reqId = null
    }
  }

  private setWrapperSize(width: number, height: number) {
    this.canvasWrapper.style.width = width / this.devicePixelRatio + 'px'
    this.canvasWrapper.style.height = height / this.devicePixelRatio + 'px'
  }

  /**
   * 表示倍率変更
   */
  private scale(newXScale = this.xScale, newYScale = this.yScale, animation = false) {
    if (animation) {
      let originXScale: number
      let originYScale: number
      if (this.reservedScale.length !== 0) {
        ;[originXScale, originYScale] = this.reservedScale[this.reservedScale.length - 1]
      } else {
        ;[originXScale, originYScale] = [this.xScale, this.yScale]
      }
      this.reservedScale = this.getEaseAnimScales(originXScale, originYScale, newXScale, newYScale, 12)
    } else {
      this.reservedScale.push([newXScale, newYScale, 0, 0])
    }
  }
  /**
   * user-scalable=noが適用されないiOSでの拡大を防ぐ
   */
  private touchstart(event: TouchEvent) {
    if (event.touches.length > 1 && event.cancelable) {
      event.preventDefault()
    }
  }
  /**
   * ピンチによる拡大縮小(モバイル)
   */
  private pinchScaling(event: TouchEvent) {
    const touches = event.changedTouches
    if (touches.length < 2) return
    if (event.cancelable) event.preventDefault()
    // 指の間の距離
    const x0 = touches[0].clientX * this.devicePixelRatio
    const y0 = touches[0].clientY * this.devicePixelRatio
    const x1 = touches[1].clientX * this.devicePixelRatio
    const y1 = touches[1].clientY * this.devicePixelRatio
    const dx = Math.max(75 * this.devicePixelRatio, Math.abs(x1 - x0))
    const dy = Math.max(75 * this.devicePixelRatio, Math.abs(y1 - y0))
    // 今ピンチが始まったかどうか
    if (this.isScaling === false) {
      this.isScaling = true
      this.pinchStart = {
        x0,
        y0,
        dx,
        dy,
        xScale: this.xScale,
        yScale: this.yScale,
        px: this.lastPosition.x,
        py: this.lastPosition.y,
      }
    } else {
      this.reservedScale = [
        [
          Math.max(this.minXScale, Math.min(this.maxXScale, (this.pinchStart.xScale * dx) / this.pinchStart.dx)), // x scale
          Math.max(this.minYScale, Math.min(this.maxYScale, (this.pinchStart.yScale * dy) / this.pinchStart.dy)), // y scale
          Math.max(
            0,
            ((this.pinchStart.px + this.pinchStart.x0 - this.paddingLeft) * dx) / this.pinchStart.dx -
              x0 +
              this.paddingLeft
          ), // left
          Math.max(
            0,
            ((this.pinchStart.py + this.pinchStart.y0 - this.paddingTop) * dy) / this.pinchStart.dy -
              y0 +
              this.paddingTop
          ), // top
        ],
      ]
    }
  }

  /**
   *  拡大縮小の終了
   */
  private pinchEnd() {
    this.isScaling = false
  }

  // 駅間距離(描画用)
  private getStationDistanceArray(): number[] {
    return this.getMinimumRunTime()
  }

  /**
   * 駅間の最小所要時間の配列を返す
   * ただし最小値は1, 隣り合う2駅を通る列車がない場合はNumber.MAX_SAFE_INTEGER
   * 当たり前だけど、配列の長さは (駅の数 - 1)
   * @returns {number[]} 駅間最小所要時間(分)
   */
  private getMinimumRunTime(): number[] {
    const len = this.stations.length
    // 結果をNumber.MAX_SAFE_INTEGERで埋めておく
    const result = new Array(len - 1).fill(Number.MAX_SAFE_INTEGER)
    // 最小値。たまに出力される駅間0分を防ぐ
    const minimum = 1
    const f = (trains: Train[], isOutbound: boolean) => {
      trains.forEach((train: Train) => {
        // 前駅の発車時刻
        let prevDep: number = null
        const data = train.timetable.data
        for (let i = 0; i < len; i++) {
          // 停車駅でない
          if (!(i in data) || (data[i].arrival === null && data[i].departure === null)) {
            prevDep = null
            continue
          }
          // 前駅に停車している
          if (prevDep !== null) {
            let delta = (data[i].arrival || data[i].departure) - prevDep
            if (delta < 0) delta += 24 * 3600
            result[isOutbound ? i - 1 : len - i - 1] = Math.max(
              minimum,
              Math.min(delta / 60, result[isOutbound ? i - 1 : len - i - 1])
            )
          }
          // 発車時刻を記録
          prevDep = data[i].departure
        }
      })
    }
    f(this.outboundTrains, true)
    f(this.inboundTrains, false)
    return result
  }

  /**
   * 描画データの計算
   */
  private calcDrawingData(): {
    totalDistance: number[]
    outbound: drawingDataItem
    inbound: drawingDataItem
  } {
    // 積算距離
    const totalDistance = [1]
    // 駅間距離の和を求める
    let y = 1
    for (const distance of this.stationDistance) {
      y += distance === Number.MAX_SAFE_INTEGER ? 1 : distance
      totalDistance.push(y)
    }
    // 上下それぞれの計算
    const func = (train: Train) => {
      const trainType = this.app.data.railway.trainTypes[train.type]
      return {
        bold: trainType.isBoldLine || false,
        color: trainType.strokeColor.toHEXString(),
        path: this.getTrainPath(train, y),
        strokeStyle: trainType.lineStyle || 'Jissen',
        trainName: train.name || '',
        trainNumber: train.number || '',
      }
    }
    const outbound = this.outboundTrains.map(func)
    const inbound = this.inboundTrains.map(func)
    return { totalDistance, outbound, inbound }
  }

  /**
   * [connection, x, y, connection, x, y, connection, x, y, ....]という配列を返す。
   * connection: boolean  -  前の点(x,y)と線を結ぶかどうか。例えば経由なしが間に入るとfalseになる
   * x, y: number
   * 上り列車のパスを計算するときは下から座標を引いていくのでheightに高さの値を入れる。
   */
  private getTrainPath(train: Train, height: number): Array<boolean | number> {
    let result = []
    const timetable = train.timetable
    // trueなら線は接続する
    let connection = false
    // 上り列車のパスを計算するときは下から座標を引いていく
    let y = train.direction === 0 ? 1 : height
    // 上り列車の時はy座標を減らしていく
    const sign = train.direction === 0 ? 1 : -1
    // 最後に描画した地点のX座標
    let lastX = -1
    // 最後の停車駅からのY座標を進んだ距離(経由なしの区間を除く)
    let distance = 0
    // 通過中に経由なしに入った場合には次の停車駅までx座標が決まらないので、y座標とその時点でのdistanceを控えておく。
    let pendingPoints: Array<[number, number]> = []
    // 1駅ずつ見ていくよ！
    for (let i = 0; i < timetable.data.length; i++) {
      const val = timetable.data[i]
      // 今回y座標を進む距離。
      const d = this.stationDistance[train.direction === 0 ? i : this.stationDistance.length - 1 - i]
      const delta = sign * (d === Number.MAX_SAFE_INTEGER ? 1 : d)
      if (val) {
        // 経由なしから飛び出した時。
        if (lastX !== -1 && !(i - 1 in timetable.data)) {
          pendingPoints.push([y, distance])
        }
        // 経由なしを通って停車駅まできたら、控えておいた点を結ぶ
        if (pendingPoints.length !== 0 && (val.departure !== null || val.arrival !== null)) {
          const x = this.getRelativeTime(val.arrival !== null ? val.arrival : val.departure)
          for (let k = 0; k < pendingPoints.length; k++) {
            result.push(k % 2 === 0, ((x - lastX) * pendingPoints[k][1]) / distance + lastX, pendingPoints[k][0])
          }
          pendingPoints = []
        }
        // 到着時刻
        if (val.arrival !== null) {
          const x = this.getRelativeTime(val.arrival)
          // 非接続点の連続は無駄よ
          if (connection === false && result[result.length - 3] === false) result = result.slice(0, -3)
          result.push(connection, x, y)
          lastX = x
        }
        // 出発時刻
        if (val.departure !== null && val.departure !== val.arrival) {
          const x = this.getRelativeTime(val.departure)
          if (connection === false && result[result.length - 3] === false) result = result.slice(0, -3)
          result.push(connection, x, y)
          lastX = x
        }
        // 線を描いたら、distanceリセット
        if (val.departure !== null || val.arrival !== null) {
          connection = true
          distance = 0
        }
        // 経由なしに飛び込む時、そのy座標を控える(始発駅を除く)
        if (lastX !== -1 && i in timetable.data && !(i + 1 in timetable.data)) {
          pendingPoints.push([y, distance])
        }
        if (val) distance += delta
      }
      y += delta
    }
    return result
  }

  /**
   * 拡大縮小のアニメーションを計算
   * @param {number} xOrig 元のx方向拡大率
   * @param {number} yOrig 元のy方向拡大率
   * @param {number} xNew 変化後のx方向拡大率
   * @param {number} yNew 変化後のy方向拡大率
   * @param {number} frames アニメーション所要フレーム数
   * @return {number[]} [拡大率x, 拡大率y, スクロール位置x, スクロール位置y]
   */
  private getEaseAnimScales(
    xOrig: number,
    yOrig: number,
    xNew: number,
    yNew: number,
    frames: number
  ): Array<[number, number, number, number]> {
    const result = []
    for (let i = 0; i < frames; i++) {
      const t = i / frames
      const tp = 1 - t
      const sx = xOrig + (t * t * t + 3 * t * t * tp * 0.58) * (xNew - xOrig)
      const sy = yOrig + (t * t * t + 3 * t * t * tp * 0.58) * (yNew - yOrig)

      result.push([
        sx,
        sy,
        Math.max(0, ((this.lastPosition.x + this.lastPosition.w / 2) * sx) / xOrig - this.lastPosition.w / 2),
        Math.max(0, ((this.lastPosition.y + this.lastPosition.h / 2) * sy) / yOrig - this.lastPosition.h / 2),
      ])
    }
    return result
  }

  /* クリックやタップにより列車を選択 */
  // x, yはクリック座標
  private getTrainByCoordinate({
    x,
    y,
  }: {
    x: number
    y: number
  }): {
    direction: 0 | 1
    trainIndex: number
    diaIndex: number
    stationIndex: number
  } {
    const x0 = this.lastPosition.x + x * this.devicePixelRatio - this.paddingLeft
    const y0 = this.lastPosition.y + y * this.devicePixelRatio - this.paddingTop
    const dMax = 81 * this.devicePixelRatio
    let minDistance = dMax
    let result
    const func = (
      trains: Array<{
        path: Array<number | boolean>
        color: string
        trainNumber: string
        trainName: string
      }>,
      direction: number
    ) => {
      const trainLength = trains.length
      for (let i = 0; i < trainLength; i++) {
        const path = trains[i].path
        const pathLength = path.length / 3
        let distance = dMax
        for (let j = 0; j < pathLength - 1; j++) {
          // path[j*3+1] -> x座標
          // path[j*3+2] -> y座標
          if (path[j * 3 + 3] === false) continue
          const x1 = (path[j * 3 + 1] as number) * this.xScale
          const x2 = (path[j * 3 + 4] as number) * this.xScale
          const y1 = (path[j * 3 + 2] as number) * this.yScale
          const y2 = (path[j * 3 + 5] as number) * this.yScale
          if (x1 === x2 && y1 === y2) continue
          distance = Math.min(distance, getDistance2({ x: x0, x1, x2, y: y0, y1, y2 })) // 距離の2乗だけど、比較できるからそれでいい
        }
        if (distance < minDistance) {
          minDistance = distance
          result = {
            direction,
            trainIndex: i,
            diaIndex: this.diaIndex,
            stationIndex: 0,
          }
        }
      }
    }
    if (this.visibleOutbound) func(this.drawingData.outbound, 0)
    if (this.visibleInbound) func(this.drawingData.inbound, 1)
    if (minDistance >= dMax) return null
    const ya = y0 / this.yScale
    let stationIndex = this.drawingData.totalDistance.findIndex(value => ya < value)
    if (
      stationIndex !== 0 &&
      (this.drawingData.totalDistance[stationIndex - 1] + this.drawingData.totalDistance[stationIndex]) / 2 > ya
    )
      stationIndex--
    result.stationIndex = stationIndex
    return result
  }
  /**
   * 画面描画
   */
  private draw() {
    const position = {
      h: this.dgViewWrapper.offsetHeight * this.devicePixelRatio,
      w: this.dgViewWrapper.offsetWidth * this.devicePixelRatio,
      x: this.dgViewWrapper.scrollLeft * this.devicePixelRatio,
      y: this.dgViewWrapper.scrollTop * this.devicePixelRatio,
    }
    this.paddingLeft = (position.w / this.devicePixelRatio < 600 ? 50 : 80) * this.devicePixelRatio
    if (position.w !== this.lastPosition.w) this.canvas.width = position.w
    if (position.h !== this.lastPosition.h) this.canvas.height = position.h

    // 再描画は必要か？
    if (
      this.forceDraw ||
      this.reservedScale.length !== 0 ||
      position.x !== this.lastPosition.x ||
      position.y !== this.lastPosition.y ||
      position.w !== this.lastPosition.w ||
      position.h !== this.lastPosition.h
    ) {
      // 表示倍率を変更するか？
      if (this.reservedScale.length !== 0) {
        const rData = this.reservedScale.shift()
        // 新しい表示倍率
        this.xScale = rData[0]
        this.yScale = rData[1]
        // スクロール位置。ダイヤグラム全体が基準の座標。
        position.x = rData[2]
        position.y = rData[3]
        // 更新
        this.setWrapperSize(
          24 * 60 * this.xScale + this.paddingTop + 50,
          this.drawingData.totalDistance[this.drawingData.totalDistance.length - 1] * this.yScale +
            this.paddingLeft +
            50
        )
        this.dgViewWrapper.scrollLeft = position.x / this.devicePixelRatio
        this.dgViewWrapper.scrollTop = position.y / this.devicePixelRatio
      }

      // カーソル移動
      if (this.pointerMoved) {
        this.hoveredTrain = this.getTrainByCoordinate(this.pointerPosition)
      }

      // canvas初期化
      this.context.fillStyle = '#f0f0f0'
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
      this.context.font = '300 ' + Math.min(12 * this.devicePixelRatio, this.yScale) + 'px "Noto Sans JP"'
      this.context.fillStyle = '#444444'
      this.context.lineWidth = 1

      // お絵かきターイム(^_^)/
      this.drawStations(position)
      this.drawTime(position)
      this.drawTrains(position)
      this.drawShadow()

      // 次回、位置が動いたか確認できるように記録
      this.lastPosition = position

      this.forceDraw = false
      this.element.style.cursor = this.hoveredTrain !== null ? 'pointer' : 'default'
    }
    this.reqId = requestAnimationFrame(this.draw.bind(this))
  }

  /**
   * 駅名と横罫線を描画
   */
  private drawStations(position: { x: number; y: number; w: number; h: number }) {
    this.context.beginPath()

    this.context.strokeStyle = '#dddddd'
    this.context.textAlign = 'right'
    this.context.textBaseline = 'bottom'
    const stationLen = this.drawingData.totalDistance.length
    const mainStations: Set<{ name: string; y: number }> = new Set()
    this.context.font = '300 ' + Math.min(12 * this.devicePixelRatio, this.yScale) + 'px "Noto Sans JP"'
    for (let i = 0; i < stationLen; i++) {
      const y = this.drawingData.totalDistance[i] * this.yScale
      if (y + this.paddingTop - position.y < 0) continue
      if (position.y + position.h < y) break
      if (this.stations[i].isMain) {
        mainStations.add({ y, name: this.stations[i].name })
        continue
      }
      this.context.moveTo(0, Math.floor(y - position.y + this.paddingTop) + 0.5)
      this.context.lineTo(
        y - position.y < 0 ? this.paddingLeft : position.w,
        Math.floor(y - position.y + this.paddingTop) + 0.5
      )
      this.context.fillText(this.stations[i].name, this.paddingLeft, y - position.y + this.paddingTop, this.paddingLeft)
    }
    this.context.stroke()
    this.context.beginPath()
    this.context.font = '500 ' + Math.min(12 * this.devicePixelRatio, this.yScale) + 'px "Noto Sans JP"'
    this.context.strokeStyle = '#bbbbbb'
    for (const station of mainStations) {
      this.context.moveTo(0, Math.floor(station.y - position.y + this.paddingTop) + 0.5)
      this.context.lineTo(
        station.y - position.y < 0 ? this.paddingLeft : position.w,
        Math.floor(station.y - position.y + this.paddingTop) + 0.5
      )
      this.context.fillText(station.name, this.paddingLeft, station.y - position.y + this.paddingTop, this.paddingLeft)
    }
    this.context.stroke()
  }
  /**
   * 時刻の文字と縦罫線を描画する。
   */
  private drawTime(position: { x: number; y: number; w: number; h: number }) {
    // d1: ラベル間隔, d2: 中目盛, d3: 小目盛
    let d1: number
    let d2: number
    let d3: number
    if (this.xScale > 15) {
      ;[d1, d2, d3] = [5, 5, 1]
    } else if (this.xScale > 5) {
      ;[d1, d2, d3] = [10, 5, 1]
    } else if (this.xScale > 4) {
      ;[d1, d2, d3] = [20, 10, 2]
    } else if (this.xScale > 2) {
      ;[d1, d2, d3] = [30, 10, 2]
    } else {
      ;[d1, d2, d3] = [60, 10, 5]
    }
    // 駅名部分に被らないように描画範囲の絞り込み
    this.context.save()
    this.context.rect(this.paddingLeft, 0, this.canvas.width - this.paddingLeft, this.canvas.height)
    this.context.clip()
    // 書式設定
    this.context.textAlign = 'center'
    this.context.textBaseline = 'bottom'
    this.context.font = '300 ' + Math.min(12 * this.devicePixelRatio, this.yScale) + 'px "Noto Sans JP"'
    // stroke数を減らすために、d1,d2は最後にまとめて描画。d3は初回なので変数に入れる必要ない。
    const d1x: Set<number> = new Set()
    const d2x: Set<number> = new Set()
    // d3
    this.context.beginPath()
    this.context.setLineDash([3, 1.5])
    this.context.strokeStyle = '#dddddd'
    for (
      let x = Math.ceil((position.x - this.paddingLeft) / this.xScale / d3) * d3;
      x * this.xScale < position.x + position.w;
      x += d3
    ) {
      if (x % d1 === 0) {
        this.context.fillText(
          numberToTimeString(x + this.startTime / 60, 'min_HH:MM'),
          x * this.xScale - position.x + this.paddingLeft,
          this.paddingTop
        )
        d1x.add(x)
      } else if (x % d2 === 0) {
        d2x.add(x)
      } else {
        this.context.moveTo(0.5 + Math.floor(x * this.xScale - position.x + this.paddingLeft), this.paddingTop)
        this.context.lineTo(0.5 + Math.floor(x * this.xScale - position.x + this.paddingLeft), position.h)
      }
    }
    this.context.stroke()
    // d2
    this.context.setLineDash([])
    this.context.beginPath()
    for (const x of d2x) {
      this.context.moveTo(0.5 + Math.floor(x * this.xScale - position.x + this.paddingLeft), this.paddingTop)
      this.context.lineTo(0.5 + Math.floor(x * this.xScale - position.x + this.paddingLeft), position.h)
    }
    this.context.stroke()
    // d1
    this.context.beginPath()
    this.context.strokeStyle = '#bbbbbb'
    for (const x of d1x) {
      this.context.moveTo(0.5 + Math.floor(x * this.xScale - position.x + this.paddingLeft), this.paddingTop)
      this.context.lineTo(0.5 + Math.floor(x * this.xScale - position.x + this.paddingLeft), position.h)
    }
    this.context.stroke()
    // 描画範囲の絞り込みを解除
    this.context.restore()
  }

  /**
   * 列車を描画
   */
  private drawTrains(position: { x: number; y: number; w: number; h: number }) {
    // 描画範囲を限定
    this.context.save()
    this.context.rect(
      this.paddingLeft,
      this.paddingTop,
      this.canvas.width - this.paddingLeft,
      this.canvas.height - this.paddingTop
    )
    this.context.clip()
    this.context.lineWidth = this.devicePixelRatio

    this.context.textAlign = 'left'
    this.context.textBaseline = 'bottom'

    // strokeの回数とか、fillStyleの変更は少ない方がいいらしい。
    // だから、スタイルごとにまとめて描画する。
    // まずは、画面内か判定して色ごとに分類
    const paths = {}
    const xl = -position.x + this.paddingLeft // よく使う数値
    const yt = -position.y + this.paddingTop // よく使う数値
    const xw = position.x + position.w // よく使う数値
    const selectTrains = (trains: drawingDataItem, direction: number) => {
      const len = trains.length
      for (let i = 0; i < len; i++) {
        const val = trains[i]
        // 画面外は描かないよ
        if (
          position.w < (val.path[1] as number) * this.xScale + xl ||
          (val.path[val.path.length - 2] as number) * this.xScale + xl < 0
        )
          continue
        // 色ごとに分類するよ
        const color = val.color
        const selected =
          (this.hoveredTrain !== null &&
            this.hoveredTrain.direction === direction &&
            this.hoveredTrain.trainIndex === i) ||
          (this.selectedTrain !== null &&
            this.selectedTrain.direction === direction &&
            this.selectedTrain.trainIndex === i)
            ? 't'
            : 'f'
        const bold = val.bold ? 't' : 'f'
        const strokeStyle = val.strokeStyle
        const style = color + ' ' + selected + ' ' + bold + ' ' + strokeStyle
        if (!(style in paths)) {
          paths[style] = [val]
        } else {
          paths[style].push(val)
        }
      }
    }
    if (this.visibleOutbound) selectTrains(this.drawingData.outbound, 0)
    if (this.visibleInbound) selectTrains(this.drawingData.inbound, 1)
    let lineWidth = 1
    let lastStrokeStyle = ''
    // 線と文字を描く
    for (const style in paths) {
      if (!paths.hasOwnProperty(style)) continue
      const [color, selected, bold, strokeStyle] = style.split(' ')
      this.context.beginPath()
      const newLineWidth = this.devicePixelRatio * ((bold === 't' ? 3 : 1) + (selected === 't' ? 1 : 0))
      if (lineWidth !== newLineWidth) {
        lineWidth = newLineWidth
        this.context.lineWidth = newLineWidth
      }
      if (strokeStyle !== lastStrokeStyle) {
        this.context.setLineDash(DASH_ARRAY_STYLE[strokeStyle].split(' '))
        lastStrokeStyle = strokeStyle
      }
      this.context.strokeStyle = color
      this.context.fillStyle = color
      for (const val of paths[style]) {
        const len = val.path.length
        if (this.visibleTrainNumber || this.visibleTrainName) {
          this.context.save()
          this.context.translate(val.path[1] * this.xScale + xl, val.path[2] * this.yScale + yt)
          this.context.rotate(
            Math.atan(((val.path[5] - val.path[2]) * this.yScale) / (val.path[4] - val.path[1]) / this.xScale)
          )
          this.context.fillText(
            (this.visibleTrainNumber === true ? val.trainNumber + ' ' : '') +
              (this.visibleTrainName === true ? val.trainName : ''),
            0,
            0
          )
          this.context.restore()
        }
        for (let i = 0; i < len; i += 3) {
          const x = val.path[i + 1] * this.xScale + xl
          const y = val.path[i + 2] * this.yScale + yt
          this.context[val.path[i] === true ? 'lineTo' : 'moveTo'](x, y)
          if (x > xw) break
        }
      }
      this.context.stroke()
    }
    this.context.restore()
    this.context.save()
    if (this.selectedTrain !== null) {
      const train = this.app.data.railway.diagrams[this.selectedTrain.diaIndex].trains[this.selectedTrain.direction][
        this.selectedTrain.trainIndex
      ]
      this.context.fillStyle = '#ffffff'
      this.context.strokeStyle = this.app.data.railway.trainTypes[train.type].strokeColor.toHEXString()
      const drawMark = (time, stationId) => {
        const rx = this.getRelativeTime(time) * this.xScale
        this.context.beginPath()
        this.context.arc(xl + rx, yt + this.drawingData.totalDistance[stationId] * this.yScale, 3, 0, Math.PI * 2)
        this.context.fill()
        this.context.stroke()
        this.context.closePath()
      }
      train.timetable.data.forEach((time, i) => {
        const stationId = train.direction === 0 ? i : this.stationDistance.length - i
        if (time.departure !== null) drawMark(time.departure, stationId)
        if (time.arrival !== null) drawMark(time.arrival, stationId)
      })
    }
    this.context.restore()
  }

  /**
   * 影を描画する
   */
  private drawShadow() {
    this.context.lineWidth = 1
    this.context.beginPath()
    // 描画 影
    // グラデーションは遅いから細線3本で影を表しまーす。あらかじめ書いて再利用するのがいいのかと思ったりするけど、そんな変わらなそう。
    this.context.strokeStyle = 'rgba(0, 0, 0, 0.18)'
    this.context.moveTo(0.5 + this.paddingLeft, 0.5 + 0)
    this.context.lineTo(0.5 + this.paddingLeft, 0.5 + this.canvas.height)
    this.context.moveTo(0.5 + this.paddingLeft, 0.5 + this.paddingTop)
    this.context.lineTo(0.5 + this.canvas.width, 0.5 + this.paddingTop)
    this.context.stroke()
    this.context.strokeStyle = 'rgba(0, 0, 0, 0.09)'
    this.context.moveTo(0.5 + this.paddingLeft + 1, 0.5 + 0)
    this.context.lineTo(0.5 + this.paddingLeft + 1, 0.5 + this.canvas.height)
    this.context.moveTo(0.5 + this.paddingLeft, 0.5 + this.paddingTop + 1)
    this.context.lineTo(0.5 + this.canvas.width, 0.5 + this.paddingTop + 1)
    this.context.stroke()
    this.context.strokeStyle = 'rgba(0, 0, 0, 0.045)'
    this.context.moveTo(0.5 + this.paddingLeft + 2, 0.5 + 0)
    this.context.lineTo(0.5 + this.paddingLeft + 2, 0.5 + this.canvas.height)
    this.context.moveTo(0.5 + this.paddingLeft, 0.5 + this.paddingTop + 2)
    this.context.lineTo(0.5 + this.canvas.width, 0.5 + this.paddingTop + 2)
    this.context.stroke()
  }
  private showNoData() {
    const noDataDialog = h('div', { class: 'dg-noData' }, '駅がありません')
    this.element.appendChild(noDataDialog)
  }
  // this.startTimeを基準とみたときの時刻(分)
  private getRelativeTime(time: number): number {
    const t1 = (time - this.startTime) / 60
    return t1 < 0 ? t1 + 1440 : t1
  }
  private viewInStationTimetableView(trainId: number, direction: 0 | 1, stationId: number) {
    this.app.showStationTimetableView(this.diaIndex, direction, trainId, stationId)
  }
  private viewInTrainTimetableView(trainId: number, direction: 0 | 1, stationId: number) {
    this.app.showTrainTimetableView(this.diaIndex, direction, trainId, stationId)
  }
}
