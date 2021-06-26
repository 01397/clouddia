import { Color, numberToTimeString, timeStringToNumber, Font } from './Util.js'

export default class DiagramParser {
  /**
   * oudiaファイルを
   * @param oudString oudia形式の文字列
   */
  public parse(oudString: string): Promise<DiagramFile> {
    // shift-jisのダメ文字問題(https://sites.google.com/site/fudist/Home/grep/sjis-damemoji-jp)
    const reg = /([\\―ソЫⅨ噂浬欺圭構.蚕十申曾箪貼能表暴予禄兔喀媾彌拿杤歃濬畚秉綵臀藹觸軆鐔饅鷭偆砡纊犾])\\/gm
    return new Promise((resolve: (value: DiagramFile) => void) => {
      const lines = oudString.replace(reg, '$1').split(/\r\n|\r|\n/)
      resolve(DiagramFile.fromOudia(lines)[0] as DiagramFile)
    })
  }
}

abstract class DiagramData {
  constructor(params = {}) {
    this.fromOudiaParams({})
    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        this[key] = params[key]
      }
    }
  }
  /**
   * oudia文字列を解析する
   * @param lines oudia文字列を1行ずつ格納した配列
   * @param count 現在処理している行番号。再帰用なので外から呼ぶときは 省略するか0を指定。
   */
  public static fromOudia(lines: string[], count = 0): [DiagramData, number] {
    const result = new (this as any)()
    const oudParams: { [x: string]: string | string[] } = {}
    const enumerables = new Set([
      'Eki',
      'EkiTrack2',
      'OuterTerminal',
      'Ressyasyubetsu',
      'Dia',
      'Ressya',
      'JikokuhyouFont',
      'JikokuhyouBackColor',
    ])
    let i: number
    for (i = count; i < lines.length; i++) {
      if (lines[i].includes('=')) {
        // 1行パラメータの処理
        const m = lines[i].indexOf('=')
        const key = lines[i].slice(0, m)
        const value = lines[i].slice(m + 1)
        if (key.indexOf('Operation') === 0) {
          oudParams.operation = lines[i]
        } else if (enumerables.has(key)) {
          if (key in oudParams) {
            ;(oudParams[key] as string[]).push(value)
          } else {
            oudParams[key] = [value]
          }
        } else {
          oudParams[key] = value
        }
      } else if (lines[i] === '.') {
        // 区間の終了
        break
      } else if (/.+\.$/.test(lines[i])) {
        // 区間の開始
        const key = lines[i].slice(0, -1)
        const [data, j] = DIAGRAM_CLASSES[key].fromOudia(lines, i + 1)
        if (enumerables.has(key)) {
          if (key in oudParams) {
            ;(oudParams[key] as string[]).push(data)
          } else {
            oudParams[key] = [data]
          }
        } else {
          oudParams[key] = data
        }
        i = j
      } else if (lines[i] !== '') {
        console.warn(i + '行目: ' + lines[i] + '不明な文字列')
      }
    }
    result.fromOudiaParams(oudParams)
    return [result, i]
  }
  /**
   * fromOudia内で、oudia文字列からプロパティへ変換するためのメソッド。
   * @param key
   */
  public fromOudiaParams(params: {}) {
    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        this[key] = params[key]
      }
    }
  }
  public toOudiaString(): string {
    return ''
  }
  /**
   * 少しだけDeep Copyする。
   * instanceof DiagramData, Array(shallow copy), Object(shallow copy)
   * 必要に応じてOverrideすること!
   */
  public clone() {
    return this.shallowCopy(new (this as any).constructor(), this)
  }
  private shallowCopy(result, origin) {
    for (const prop in origin) {
      const val = origin[prop]
      if (val === null) {
        result[prop] = null
      } else if (val === undefined) {
        result[prop] = undefined
      } else if (val instanceof DiagramData || val instanceof Color || val instanceof Font) {
        result[prop] = val.clone()
      } else if (val instanceof Array) {
        result[prop] = Array.from(val)
      } else if (val.constructor.name === 'Object') {
        Object.assign({}, val)
      } else {
        result[prop] = val
      }
    }
    return result
  }
}

// ルート
export class DiagramFile extends DiagramData {
  public fileType: string
  public fileTypeAppComment: string
  public displayProperty: DisplayProperty
  public railway: Railway
  public fromOudiaParams(params) {
    this.fileType = params.hasOwnProperty('FileType') ? params.FileType : 'OuDia.1.07'
    this.fileTypeAppComment = params.hasOwnProperty('FileTypeAppComment') ? params.FileTypeAppComment : 'CloudDia 1.0' //仮の値
    this.displayProperty = params.hasOwnProperty('DispProp') ? params.DispProp : new DisplayProperty()
    this.railway = params.hasOwnProperty('Rosen') ? params.Rosen : new Railway()
  }
  public saveAsOud(fileTypeAppComment: string): string {
    const result = `FileType=OuDia.1.02\n${this.railway.toOudiaString()}${this.displayProperty.toOudiaString()}FileTypeAppComment=${fileTypeAppComment}\n`
    return result
  }
}

// Rosenに相当
export class Railway extends DiagramData {
  public name: string
  public directionName: string[]
  public startTime: number
  public stationInterval: number
  public enableOperation: boolean
  public comment: string
  public trainTypes: TrainType[]
  public stations: Station[]
  public diagrams: Diagram[]
  public clone() {
    const result = super.clone()
    result.trainTypes = this.trainTypes.map(v => v.clone())
    result.stations = this.stations.map(v => v.clone())
    result.diagrams = this.diagrams.map(v => v.clone())
    return result
  }
  public fromOudiaParams(params) {
    this.name = params.hasOwnProperty('Rosenmei') ? params.Rosenmei : '新規路線'
    this.directionName = []
    this.directionName[0] =
      params.hasOwnProperty('KudariDiaAlias') && params.KudariDiaAlias !== '' ? params.KudariDiaAlias : '下り'
    this.directionName[1] =
      params.hasOwnProperty('NoboriDiaAlias') && params.KudariDiaAlias !== '' ? params.NoboriDiaAlias : '上り'
    this.startTime = params.hasOwnProperty('KitenJikoku') ? timeStringToNumber(params.KitenJikoku) : 4 * 3600
    this.stationInterval = params.hasOwnProperty('DiagramDgrYZahyouKyoriDefault')
      ? Number(params.DiagramDgrYZahyouKyoriDefault)
      : 60
    this.enableOperation = params.hasOwnProperty('EnableOperation') ? params.EnableOperation === '1' : false
    this.comment = params.hasOwnProperty('Comment') ? params.Comment.replace(/\\n/g, '\n') : ''
    this.stations = params.hasOwnProperty('Eki') ? params.Eki : []
    this.trainTypes = params.hasOwnProperty('Ressyasyubetsu') ? params.Ressyasyubetsu : [new TrainType()]
    this.diagrams = params.hasOwnProperty('Dia') ? params.Dia : [new Diagram()]
  }
  public toOudiaString(): string {
    return (
      'Rosen.\n' +
      'Rosenmei=' +
      this.name +
      '\n' +
      this.stations.map(station => station.toOudiaString()).join('') +
      this.trainTypes.map(trainType => trainType.toOudiaString()).join('') +
      this.diagrams.map(diagram => diagram.toOudiaString()).join('') +
      `KitenJikoku=${numberToTimeString(this.startTime, 'HMM')}\n` +
      `DiagramDgrYZahyouKyoriDefault=${this.stationInterval}\n` +
      `Comment=${this.comment.replace(/\n/g, '\\n')}\n` +
      '.\n'
    )
  }
}

export class Station extends DiagramData {
  public name: string
  public abbrName: string
  public timetableStyle: {
    arrival: [boolean, boolean]
    departure: [boolean, boolean]
  }
  public visibleDiagramInfo: [string, string]
  public mainTrack: [number, number]
  public isMain: boolean
  public border: boolean
  public brunchCoreStationIndex: number | null
  public isBrunchOpposite: boolean
  public loopOriginStationIndex: number | null
  public isLoopOpposite: boolean
  public visibleTimetableTrack: [boolean, boolean]
  public visibleDiagramTrack: boolean
  public nextStaionDistance: number | null
  public timetableTrackOmit: boolean
  public operationLength: [number, number]
  public customTimetableStyle: {
    arrival: boolean[]
    departure: boolean[]
    trainNumber: boolean[]
    operationNumber: boolean[]
    trainType: boolean[]
    trainName: boolean[]
  }
  public tracks: [StationTrack, ...StationTrack[]]
  public outerTerminal: OuterTerminal[]
  public clone() {
    const result = super.clone()
    result.timetableStyle.arrival = [this.timetableStyle.arrival[0], this.timetableStyle.arrival[1]]
    result.timetableStyle.departure = [this.timetableStyle.departure[0], this.timetableStyle.departure[1]]
    result.customTimetableStyle = JSON.parse(JSON.stringify(this.customTimetableStyle))
    return result
  }
  public fromOudiaParams(params) {
    this.name = params.hasOwnProperty('Ekimei') ? params.Ekimei : '駅名未設定'
    this.abbrName = params.hasOwnProperty('EkimeiJikokuRyaku') ? params.EkimeiJikokuRyaku : ''
    switch (params.Ekijikokukeisiki) {
      case 'Jikokukeisiki_Hatsu':
        this.timetableStyle = {
          arrival: [false, false],
          departure: [true, true],
        }
        break
      case 'Jikokukeisiki_Hatsuchaku':
        this.timetableStyle = {
          arrival: [true, true],
          departure: [true, true],
        }
        break
      case 'Jikokukeisiki_KudariChaku':
        this.timetableStyle = {
          arrival: [true, false],
          departure: [false, true],
        }
        break
      case 'Jikokukeisiki_NoboriChaku':
        this.timetableStyle = {
          arrival: [false, true],
          departure: [true, false],
        }
        break
      case 'Jikokukeisiki_NoboriHatsuChaku':
        this.timetableStyle = {
          arrival: [false, true],
          departure: [true, true],
        }
        break
      case 'Jikokukeisiki_KudariHatsuChaku':
        this.timetableStyle = {
          arrival: [true, false],
          departure: [true, true],
        }
        break
      default:
        this.timetableStyle = {
          arrival: [false, false],
          departure: [true, true],
        }
        break
    }
    this.isMain = params.hasOwnProperty('Ekikibo') ? params.Ekikibo === 'Ekikibo_Syuyou' : false
    this.border = params.hasOwnProperty('Kyoukaisen') ? params.Kyoukaisen === '1' : false // oud2ndV2では廃止
    this.visibleDiagramInfo = ['Origin', 'Origin']
    if (params.hasOwnProperty('DiagramRessyajouhouHyoujiKudari'))
      this.visibleDiagramInfo[0] = params.DiagramRessyajouhouHyoujiKudari.replace('DiagramRessyajouhouHyouji_', '')
    if (params.hasOwnProperty('DiagramRessyajouhouHyoujiNobori'))
      this.visibleDiagramInfo[1] = params.DiagramRessyajouhouHyoujiNobori.replace('DiagramRessyajouhouHyouji_', '')
    this.mainTrack = [1, 0]
    if (params.hasOwnProperty('DownMain')) this.mainTrack[0] = Number(params.DownMain)
    if (params.hasOwnProperty('UpMain')) this.mainTrack[1] = Number(params.UpMain)
    this.tracks = params.hasOwnProperty('EkiTrack2Cont') ? params.EkiTrack2Cont.tracks : StationTrackList.defaultTracks
    this.outerTerminal = params.hasOwnProperty('OuterTerminal') ? params.OuterTerminal : null
    this.brunchCoreStationIndex = params.hasOwnProperty('BrunchCoreEkiIndex') ? Number(params.BrunchCoreEkiIndex) : null
    this.isBrunchOpposite = params.hasOwnProperty('BrunchOpposite') ? params.BrunchOpposite === '1' : false
    this.loopOriginStationIndex = params.hasOwnProperty('LoopOriginEkiIndex') ? Number(params.LoopOriginEkiIndex) : null
    this.isLoopOpposite = params.hasOwnProperty('LoopOpposite') ? params.LoopOpposite === '1' : false
    this.visibleTimetableTrack = [false, false]
    if (params.hasOwnProperty('JikokuhyouTrackDisplayKudari'))
      this.visibleTimetableTrack[0] = params.JikokuhyouTrackDisplayKudari === '1'
    if (params.hasOwnProperty('JikokuhyouTrackDisplayNobori'))
      this.visibleTimetableTrack[1] = params.JikokuhyouTrackDisplayNobori === '1'
    this.visibleDiagramTrack = params.hasOwnProperty('DiagramTrackDisplay') ? params.DiagramTrackDisplay === '1' : false
    this.nextStaionDistance = params.hasOwnProperty('NextEkiDistance') ? Number(params.NextEkiDistance) : null
    this.timetableTrackOmit = params.hasOwnProperty('JikokuhyouTrackOmit') ? params.JikokuhyouTrackOmit === '1' : false
    this.operationLength = [0, 0]
    if (params.hasOwnProperty('JikokuhyouOperationOrigin'))
      this.operationLength[0] = Number(params.JikokuhyouOperationOrigin)
    if (params.hasOwnProperty('JikokuhyouOperationTerminal'))
      this.operationLength[1] = Number(params.JikokuhyouOperationTerminal)
    this.customTimetableStyle = {
      arrival: [false, false],
      departure: [true, true],
      trainNumber: [false, false],
      operationNumber: [false, false],
      trainType: [false, false],
      trainName: [false, false],
    }
    if (params.hasOwnProperty('JikokuhyouJikokuDisplayKudari')) {
      const s = params.JikokuhyouJikokuDisplayKudari.split(',')
      this.customTimetableStyle.arrival[0] = s[0] === 1
      this.customTimetableStyle.departure[0] = s[1] === 1
    }
    if (params.hasOwnProperty('JikokuhyouJikokuDisplayNobori')) {
      const s = params.JikokuhyouJikokuDisplayNobori.split(',')
      this.customTimetableStyle.arrival[1] = s[0] === 1
      this.customTimetableStyle.departure[1] = s[1] === 1
    }
    if (params.hasOwnProperty('JikokuhyouSyubetsuChangeDisplayKudari')) {
      const s = params.JikokuhyouSyubetsuChangeDisplayKudari
      this.customTimetableStyle.trainNumber[0] = s[0] === 1
      this.customTimetableStyle.operationNumber[0] = s[1] === 1
      this.customTimetableStyle.trainType[0] = s[2] === 1
      this.customTimetableStyle.trainName[0] = s[3] === 1
    }
    if (params.hasOwnProperty('JikokuhyouSyubetsuChangeDisplayNobori')) {
      const s = params.JikokuhyouSyubetsuChangeDisplayNobori
      this.customTimetableStyle.trainNumber[1] = s[0] === 1
      this.customTimetableStyle.operationNumber[1] = s[1] === 1
      this.customTimetableStyle.trainType[1] = s[2] === 1
      this.customTimetableStyle.trainName[1] = s[3] === 1
    }
  }
  public toOudiaString() {
    return (
      'Eki.\n' +
      'Ekimei=' +
      this.name +
      '\n' +
      'Ekijikokukeisiki=' +
      this.getTimetableStyle() +
      '\n' +
      'Ekikibo=' +
      (this.isMain ? 'Ekikibo_Syuyou' : 'Ekikibo_Ippan') +
      '\n' +
      (this.border ? 'Kyoukaisen=1\n' : '') +
      (this.visibleDiagramInfo[0] !== 'Origin'
        ? 'DiagramRessyajouhouHyoujiKudari=DiagramRessyajouhouHyouji_' + this.visibleDiagramInfo[0] + '\n'
        : '') +
      (this.visibleDiagramInfo[1] !== 'Origin'
        ? 'DiagramRessyajouhouHyoujiNobori=DiagramRessyajouhouHyouji_' + this.visibleDiagramInfo[1] + '\n'
        : '') +
      '.\n'
    )
  }
  public getTimetableStyle() {
    const n =
      (Number(this.timetableStyle.arrival[0]) << 3) +
      (Number(this.timetableStyle.arrival[1]) << 2) +
      (Number(this.timetableStyle.departure[0]) << 1) +
      Number(this.timetableStyle.departure[1])
    switch (n) {
      case 3:
        return 'Jikokukeisiki_Hatsu'
      case 15:
        return 'Jikokukeisiki_Hatsuchaku'
      case 9:
        return 'Jikokukeisiki_KudariChaku'
      case 6:
        return 'Jikokukeisiki_NoboriChaku'
    }
    return 'Jikokukeisiki_Hatsu'
  }
  public addTrack() {
    const lName = this.tracks[this.tracks.length - 1].name
    const lAbbrName = this.tracks[this.tracks.length - 1].abbrName
    const m1 = lName.match(/\d+/)
    const m2 = lAbbrName[0].match(/\d+/)
    const m3 = lAbbrName[1].match(/\d+/)
    let name = '1番線'
    const abbrName = ['1', '']
    if (m1 !== null && Number.isInteger(Number(m1[0]))) name = lName.replace(/\d+/, String(Number(m1[0]) + 1))
    if (m2 !== null && Number.isInteger(Number(m2[0])))
      abbrName[0] = lAbbrName[0].replace(/\d+/, String(Number(m2[0]) + 1))
    if (m3 !== null && Number.isInteger(Number(m3[0])))
      abbrName[1] = lAbbrName[1].replace(/\d+/, String(Number(m3[0]) + 1))
    this.tracks.push(new StationTrack({ name, abbrName }))
  }
}

export class StationTrack extends DiagramData {
  public name: string
  public abbrName: [string, string]
  public fromOudiaParams(params) {
    this.name = params.hasOwnProperty('TrackName') ? params.TrackName : ''
    this.abbrName = ['', '']
    this.abbrName[0] = params.hasOwnProperty('TrackRyakusyou') ? params.TrackRyakusyou : ''
    this.abbrName[1] = params.hasOwnProperty('TrackNoboriRyakusyou') ? params.TrackNoboriRyakusyou : ''
  }
}

// EkiTrack2Contに相当. parseの過程で一時的に現れて消えてゆく
export class StationTrackList extends DiagramData {
  public tracks: StationTrack[]
  public fromOudiaParams(params) {
    this.tracks = params.hasOwnProperty('EkiTrack2') ? params.EkiTrack2 : null
  }
  public static get defaultTracks() {
    return [
      new StationTrack({ name: '1番線', abbrName: ['1', ''] }),
      new StationTrack({ name: '2番線', abbrName: ['2', ''] }),
    ]
  }
}

// OuterTerminalに相当
export class OuterTerminal extends DiagramData {
  public name: string
  public timetableName: string
  public diagramName: string
  public fromOudiaParams(params) {
    this.name = params.hasOwnProperty('OuterTerminalEkimei') ? params.OuterTerminalEkimei : '名称未設定'
    this.timetableName = params.hasOwnProperty('OuterTerminalJikokuRyaku') ? params.OuterTerminalJikokuRyaku : null
    this.diagramName = params.hasOwnProperty('OuterTerminalDiaRyaku') ? params.OuterTerminalDiaRyaku : null
  }
}

// Ressyasyubetsuに相当
export class TrainType extends DiagramData {
  public name: string
  public abbrName: string
  public textColor: Color
  public fontIndex: number
  public backgroundColor: Color
  public strokeColor: Color
  public lineStyle: string
  public isBoldLine: boolean
  public stopMark: boolean
  public parentIndex: number | null
  public fromOudiaParams(params) {
    this.name = params.hasOwnProperty('Syubetsumei') ? params.Syubetsumei : '新規種別'
    this.abbrName = params.hasOwnProperty('Ryakusyou') ? params.Ryakusyou : '新規'
    this.textColor = params.hasOwnProperty('JikokuhyouMojiColor')
      ? Color.from(params.JikokuhyouMojiColor)
      : new Color(0, 0, 0)
    this.fontIndex = params.hasOwnProperty('JikokuhyouFontIndex') ? Number(params.JikokuhyouFontIndex) : 0
    this.backgroundColor = params.hasOwnProperty('JikokuhyouBackColor')
      ? Color.from(params.JikokuhyouBackColor[0])
      : new Color(255, 255, 255) // DispPropの同名プロパティが列挙可能なせいでparams.JikokuhyouBackColorは配列になっちゃってる
    this.strokeColor = params.hasOwnProperty('DiagramSenColor')
      ? Color.from(params.DiagramSenColor)
      : new Color(0, 0, 0)
    this.lineStyle = params.hasOwnProperty('DiagramSenStyle')
      ? params.DiagramSenStyle.replace('SenStyle_', '')
      : 'Jissen'
    this.isBoldLine = params.hasOwnProperty('DiagramSenIsBold') ? params.DiagramSenIsBold === '1' : false
    this.stopMark = params.hasOwnProperty('StopMarkDrawType')
      ? params.StopMarkDrawType === 'EStopMarkDrawType_DrawOnStop'
      : false
    this.parentIndex = params.hasOwnProperty('ParentSyubetsuIndex') ? Number(params.ParentSyubetsuIndex) : null
  }
  public toOudiaString() {
    return (
      'Ressyasyubetsu.\n' +
      'Syubetsumei=' +
      this.name +
      '\n' +
      'Ryakusyou=' +
      this.abbrName +
      '\n' +
      'JikokuhyouMojiColor=' +
      this.textColor.toOudiaString() +
      '\n' +
      'JikokuhyouFontIndex=' +
      this.fontIndex +
      '\n' +
      'DiagramSenColor=' +
      this.strokeColor.toOudiaString() +
      '\n' +
      'DiagramSenStyle=SenStyle_' +
      this.lineStyle +
      '\n' +
      (this.isBoldLine ? 'DiagramSenIsBold=1\n' : '') +
      (this.stopMark ? 'StopMarkDrawType=EStopMarkDrawType_DrawOnStop\n' : '') +
      '.\n'
    )
  }
}

// Diaに相当
export class Diagram extends DiagramData {
  public name: string
  public mainBackgroundColorIndex: number
  public subBackgroundColorIndex: number
  public backgroundPatternIndex: number
  public trains: [Train[], Train[]]
  public clone() {
    const result = super.clone()
    result.trains[0] = this.trains[0].map(v => v.clone())
    result.trains[1] = this.trains[1].map(v => v.clone())
    return result
  }
  public fromOudiaParams(params) {
    this.name = params.hasOwnProperty('DiaName') ? params.DiaName : '新規ダイヤ'
    this.mainBackgroundColorIndex = params.hasOwnProperty('MainBackColorIndex') ? Number(params.MainBackColorIndex) : 0
    this.subBackgroundColorIndex = params.hasOwnProperty('SubBackColorIndex') ? Number(params.SubBackColorIndex) : 0
    this.backgroundPatternIndex = params.hasOwnProperty('BackPatternIndex') ? Number(params.BackPatternIndex) : 0
    this.trains = [[], []]
    this.trains[0] = params.hasOwnProperty('Kudari') ? params.Kudari.trains || [] : []
    this.trains[1] = params.hasOwnProperty('Nobori') ? params.Nobori.trains || [] : []
  }
  public toOudiaString(): string {
    return (
      'Dia.\n' +
      'DiaName=' +
      this.name +
      '\n' +
      'Kudari.\n' +
      this.trains[0].map(train => train.toOudiaString()).join('') +
      '.\n' +
      'Nobori.\n' +
      this.trains[1].map(train => train.toOudiaString()).join('') +
      '.\n' +
      '.\n'
    )
  }
}

// Kudari, Noboriに相当. parseの過程で一時的に現れて消えてゆく
export class TrainList extends DiagramData {
  public trains: Train[]
  public fromOudiaParams(params) {
    this.trains = params.Ressya
  }
}

// Ressyaに相当
export class Train extends DiagramData {
  public direction: number
  public type: number
  public number: string
  public name: string
  public count: string
  public timetable: StationTime
  public note: string
  public operations
  public fromOudiaParams(params) {
    this.direction = params.hasOwnProperty('Houkou') ? (params.Houkou === 'Kudari' ? 0 : 1) : 0
    this.type = params.hasOwnProperty('Syubetsu') ? Number(params.Syubetsu) : 0
    this.number = params.hasOwnProperty('Ressyabangou') ? params.Ressyabangou : ''
    this.name = params.hasOwnProperty('Ressyamei') ? params.Ressyamei : ''
    this.count = params.hasOwnProperty('Gousuu') ? params.Gousuu : ''
    this.timetable = params.hasOwnProperty('EkiJikoku') ? StationTime.from(params.EkiJikoku) : new StationTime()
    this.note = params.hasOwnProperty('Bikou') ? params.Bikou : null
    this.operations = params.hasOwnProperty('Operation') ? params.Operation : null
  }
  public toOudiaString(): string {
    return (
      'Ressya.\n' +
      'Houkou=' +
      (this.direction === 0 ? 'Kudari' : 'Nobori') +
      '\n' +
      'Syubetsu=' +
      this.type +
      '\n' +
      (this.number !== null ? 'Ressyabangou=' + this.number + '\n' : '') +
      (this.name !== null ? 'Ressyamei=' + this.name + '\n' : '') +
      (this.count !== null ? 'Gousuu=' + this.count + '\n' : '') +
      'EkiJikoku=' +
      this.timetable.toOudiaString() +
      '\n' +
      (this.note !== null ? 'Bikou=' + this.note + '\n' : '') +
      '.\n'
    )
  }
  public clone() {
    const result = super.clone()
    result.timetable = this.timetable.clone()
    return result
  }
}

// DispPropに相当
export class DisplayProperty extends DiagramData {
  public commentFont: Font
  public diagramStationFont: Font
  public diagramBackgroundColor: Color
  public diagramTimeFont: Font
  public diagramAxisColor: Color
  public diagramTextColor: Color
  public diagramTrainColor: Color
  public diagramTrainFont: Font
  public stationNameLength: number
  public timetableTrainWidth: number
  public timetableFont: Font[]
  public timetableVFont: Font
  public stdOpeTimeLowerColor: Color
  public stdOpeTimeHigherColor: Color
  public stdOpeTimeUndefColor: Color
  public stdOpeTimeIllegalColor: Color
  public anySecondIncDec1: number
  public anySecondIncDec2: number
  public visibleTrainName: boolean
  public visibleOuterTerminalOriginSide: boolean
  public visibleOuterTerminalTerminalSide: boolean
  public visibleOuterTerminal: boolean
  public clone() {
    const result = super.clone()
    result.timetableFont = this.timetableFont.map(v => v.clone())
    return result
  }
  public fromOudiaParams(params) {
    this.timetableFont = params.hasOwnProperty('JikokuhyouFont')
      ? params.JikokuhyouFont.map((value: string) => Font.from(value))
      : new Array(8).fill(0).map(() => new Font())
    this.timetableVFont = params.hasOwnProperty('JikokuhyouVFont') ? Font.from(params.JikokuhyouVFont) : new Font()
    this.diagramStationFont = params.hasOwnProperty('DiaEkimeiFont') ? Font.from(params.DiaEkimeiFont) : new Font()
    this.diagramTimeFont = params.hasOwnProperty('DiaJikokuFont') ? Font.from(params.DiaJikokuFont) : new Font()
    this.commentFont = params.hasOwnProperty('CommentFont') ? Font.from(params.CommentFont) : new Font()
    this.diagramTrainFont = params.hasOwnProperty('DiaRessyaFont') ? Font.from(params.DiaRessyaFont) : new Font()
    this.diagramTrainFont = params.hasOwnProperty('DiaRessyaFont') ? Font.from(params.DiaRessyaFont) : new Font()
    this.diagramTextColor = params.hasOwnProperty('DiaMojiColor') ? Color.from(params.DiaMojiColor) : new Color(0, 0, 0)
    this.diagramBackgroundColor = params.hasOwnProperty('DiaHaikeiColor')
      ? Color.from(params.DiaHaikeiColor)
      : new Color(255, 255, 255)
    this.diagramTrainColor = params.hasOwnProperty('DiaRessyaColor')
      ? Color.from(params.DiaRessyaColor)
      : new Color(0, 0, 0)
    this.diagramAxisColor = params.hasOwnProperty('DiaJikuColor')
      ? Color.from(params.DiaJikuColor)
      : new Color(191, 191, 191)
    this.stdOpeTimeLowerColor = params.hasOwnProperty('StdOpeTimeLowerColor')
      ? Color.from(params.StdOpeTimeLowerColor)
      : new Color(255, 191, 191)
    this.stdOpeTimeHigherColor = params.hasOwnProperty('StdOpeTimeHigherColor')
      ? Color.from(params.StdOpeTimeHigherColor)
      : new Color(191, 191, 255)
    this.stdOpeTimeUndefColor = params.hasOwnProperty('StdOpeTimeUndefColor')
      ? Color.from(params.StdOpeTimeUndefColor)
      : new Color(255, 255, 191)
    this.stdOpeTimeIllegalColor = params.hasOwnProperty('StdOpeTimeIllegalColor')
      ? Color.from(params.StdOpeTimeIllegalColor)
      : new Color(191, 191, 191)
    this.stationNameLength = params.hasOwnProperty('EkimeiLength') ? Number(params.EkimeiLength) : 6
    this.timetableTrainWidth = params.hasOwnProperty('JikokuhyouRessyaWidth') ? Number(params.JikokuhyouRessyaWidth) : 5
    this.anySecondIncDec1 = params.hasOwnProperty('AnySecondIncDec1') ? Number(params.AnySecondIncDec1) : 5
    this.anySecondIncDec2 = params.hasOwnProperty('AnySecondIncDec2') ? Number(params.AnySecondIncDec2) : 15
    this.visibleTrainName = params.hasOwnProperty('DisplayRessyamei') ? params.DisplayRessyamei === '1' : true
    this.visibleOuterTerminalOriginSide = params.hasOwnProperty('DisplayOuterTerminalEkimeiOriginSide')
      ? params.DisplayOuterTerminalEkimeiOriginSide === '1'
      : false
    this.visibleOuterTerminalTerminalSide = params.hasOwnProperty('DisplayOuterTerminalEkimeiTerminalSide')
      ? params.DisplayOuterTerminalEkimeiTerminalSide === '1'
      : false
    this.visibleOuterTerminal = params.hasOwnProperty('DiagramDisplayOuterTerminal')
      ? params.DiagramDisplayOuterTerminal === '1'
      : false
  }
  public toOudiaString(): string {
    return (
      'DispProp.\n' +
      this.timetableFont.map(font => 'JikokuhyouFont=' + font.toOudiaString()).join('\n') +
      '\n' +
      'JikokuhyouVFont=' +
      this.timetableVFont.toOudiaString() +
      '\n' +
      'DiaEkimeiFont=' +
      this.diagramStationFont.toOudiaString() +
      '\n' +
      'DiaJikokuFont=' +
      this.diagramTimeFont.toOudiaString() +
      '\n' +
      'CommentFont=' +
      this.commentFont.toOudiaString() +
      '\n' +
      'DiaRessyaFont=' +
      this.diagramTrainFont.toOudiaString() +
      '\n' +
      'DiaRessyaFont=' +
      this.diagramTrainFont.toOudiaString() +
      '\n' +
      'DiaMojiColor=' +
      this.diagramTextColor.toOudiaString() +
      '\n' +
      'DiaHaikeiColor=' +
      this.diagramTextColor.toOudiaString() +
      '\n' +
      'DiaRessyaColor=' +
      this.diagramBackgroundColor.toOudiaString() +
      '\n' +
      'DiaJikuColor=' +
      this.diagramTrainColor.toOudiaString() +
      '\n' +
      'DiaMojiColor=' +
      this.diagramAxisColor.toOudiaString() +
      '\n' +
      'EkimeiLength=' +
      this.stationNameLength +
      '\n' +
      'JikokuhyouRessyaWidth=' +
      this.timetableTrainWidth +
      '\n' +
      '.\n'
    )
  }
}

// EkiJikoku
export class StationTime {
  /**
   * 始発駅番号(方向別！！)
   */
  public firstStationIndex: number
  /**
   * 終着駅番号(方向別！！)
   */
  public terminalStationIndex: number
  private _data: Array<{
    stopType: number
    arrival: number | null
    departure: number | null
    track: number | null
  }>
  constructor() {
    this.firstStationIndex = -1
    this.terminalStationIndex = -1
    this._data = []
  }
  public clone() {
    const result = new StationTime()
    result._data = this._data.map(v => Object.assign({}, v))
    result.firstStationIndex = this.firstStationIndex
    result.terminalStationIndex = this.terminalStationIndex
    return result
  }
  public get data() {
    return this._data
  }
  public static from(oudString: string): StationTime {
    const result = new this()
    result._data = []
    result.terminalStationIndex = 0
    oudString.split(',').forEach((value, i) => {
      if (value === '') return
      // value: 's;a/d$t'       's;a/$t'     's;d$t'      's$t'      's;a/d'      's;a/'      's;d'      's'
      //    s1: ['s;a/d', 't'] ['s;a/', 't'] ['s;d', 't'] ['s', 't'] ['s;a/d']    ['s;a/']    ['s;d']    ['s']
      //    s2: ['s', 'a/d']   ['s', 'a/']   ['s', 'd']   ['s']      ['s', 'a/d'] ['s', 'a/'] ['s', 'd'] ['s']
      //    s3: ['a', 'd']     ['a', '']     ['d']                   ['a', 'd']   ['a', '']   ['d']
      const s1 = value.split('$')
      const s2 = s1[0].split(';')
      const track = s1.length === 2 ? Number(s1[1]) : 0
      const stopType = Number(s2[0])
      if (stopType === 3) return
      if (s2.length === 1) {
        result._data[i] = { stopType, arrival: null, departure: null, track }
        return
      }
      const s3 = s2[1].split('/')
      const arrival = s3.length === 2 ? timeStringToNumber(s3.shift()!) : null
      const departure = s3[0] !== '' ? timeStringToNumber(s3[0]) : null
      result._data[i] = { stopType, arrival, departure, track }
      result.terminalStationIndex = i
    })
    result.firstStationIndex = result._data.findIndex(v => v)
    return result
  }
  public update() {
    const data = this._data
    let s = -1,
      e = -1
    for (let i = 0; i < data.length; i++) {
      if (!(i in data)) continue
      if (data[i].stopType === 3) {
        delete data[i]
        continue
      }
      if (s === -1) s = i
      e = i
    }
    this.firstStationIndex = s
    this.terminalStationIndex = e
  }
  public toOudiaString(): string {
    let result = ''
    for (let i = 0; i < this.firstStationIndex; i++) {
      result += ','
    }
    for (let i = this.firstStationIndex; i <= this.terminalStationIndex; i++) {
      if (!(i in this._data)) {
        result += '3'
      } else {
        result += this._data[i].stopType + ';'
        const arr = this._data[i].arrival
        const dep = this._data[i].departure
        if (arr !== null) {
          result += numberToTimeString(arr, 'HMM') + '/'
        }
        if (dep !== null) {
          result += numberToTimeString(dep, 'HMM')
        }
      }
      result += ','
    }
    // remove the last comma
    result = result.slice(0, -1)
    return result
  }
}

const DIAGRAM_CLASSES = {
  Eki: Station,
  EkiTrack2Cont: StationTrackList,
  EkiTrack2: StationTrack,
  OuterTerminal: OuterTerminal,
  Ressyasyubetsu: TrainType,
  Dia: Diagram,
  Kudari: TrainList,
  Nobori: TrainList,
  Ressya: Train,
  Rosen: Railway,
  DispProp: DisplayProperty,
}
