import { Color, numberToTimeString, timeStringToNumber, Font } from './Util.js';
export default class DiagramParser {
    /**
     * oudiaファイルを
     * @param oudString oudia形式の文字列
     */
    parse(oudString) {
        return new Promise((resolve) => {
            const lines = oudString.split(/\r\n|\r|\n/);
            resolve(DiagramFile.fromOudia(lines)[0]);
        });
    }
}
export class DiagramData {
    /**
     * oudia文字列を解析する
     * @param lines oudia文字列を1行ずつ格納した配列
     * @param count 現在処理している行番号。再帰用なので外から呼ぶときは 省略するか0を指定。
     */
    static fromOudia(lines, count = 0) {
        const result = new this();
        const oudParams = {};
        const enumerables = new Set(['Eki', 'EkiTrack2', 'OuterTerminal', 'Ressyasyubetsu', 'Dia', 'Ressya', 'JikokuhyouFont', 'JikokuhyouBackColor']);
        let i;
        for (i = count; i < lines.length; i++) {
            if (lines[i].includes('=')) {
                // 1行パラメータの処理
                const m = lines[i].indexOf('=');
                const key = lines[i].slice(0, m);
                const value = lines[i].slice(m + 1);
                if (key.indexOf('Operation') === 0) {
                    oudParams.operation = lines[i];
                }
                else if (enumerables.has(key)) {
                    if (key in oudParams) {
                        oudParams[key].push(value);
                    }
                    else {
                        oudParams[key] = [value];
                    }
                }
                else {
                    oudParams[key] = value;
                }
            }
            else if (lines[i] === '.') {
                // 区間の終了
                break;
            }
            else if (/.+\.$/.test(lines[i])) {
                // 区間の開始
                const key = lines[i].slice(0, -1);
                const [data, j] = DIAGRAM_CLASSES[key].fromOudia(lines, i + 1);
                if (enumerables.has(key)) {
                    if (key in oudParams) {
                        oudParams[key].push(data);
                    }
                    else {
                        oudParams[key] = [data];
                    }
                }
                else {
                    oudParams[key] = data;
                }
                i = j;
            }
            else if (lines[i] !== '') {
                console.warn(i + '行目: ' + lines[i] + '不明な文字列');
            }
        }
        result.fromOudiaParams(oudParams);
        return [result, i];
    }
    constructor(params = {}) {
        this.fromOudiaParams({});
        for (const key in params) {
            if (params.hasOwnProperty(key)) {
                this[key] = params[key];
            }
        }
    }
    /**
     * fromOudia内で、oudia文字列からプロパティへ変換するためのメソッド。
     * @param key
     */
    fromOudiaParams(params) {
        for (const key in params) {
            if (params.hasOwnProperty(key)) {
                this[key] = params[key];
            }
        }
    }
    toOudiaString() {
        return '';
    }
}
// ルート
export class DiagramFile extends DiagramData {
    fromOudiaParams(params) {
        this.fileType = params.hasOwnProperty('FileType') ? params.FileType : 'OuDia.1.07';
        this.fileTypeAppComment = params.hasOwnProperty('FileTypeAppComment') ? params.FileTypeAppComment : 'CloudDia 1.0'; //仮の値
        this.displayProperty = params.hasOwnProperty('DispProp') ? params.DispProp : new DisplayProperty();
        this.railway = params.hasOwnProperty('Rosen') ? params.Rosen : new Railway();
    }
    saveAsOud(fileTypeAppComment) {
        const result = `FileType=OuDia.1.02\n${this.railway.toOudiaString()}${this.displayProperty.toOudiaString()}FileTypeAppComment=${fileTypeAppComment}\n`;
        return result;
    }
}
// Rosenに相当
export class Railway extends DiagramData {
    fromOudiaParams(params) {
        this.name = params.hasOwnProperty('Rosenmei') ? params.Rosenmei : '新規路線';
        this.directionName = [];
        this.directionName[0] = params.hasOwnProperty('KudariDiaAlias') && params.KudariDiaAlias !== '' ? params.KudariDiaAlias : '下り';
        this.directionName[1] = params.hasOwnProperty('NoboriDiaAlias') && params.KudariDiaAlias !== '' ? params.NoboriDiaAlias : '上り';
        this.startTime = params.hasOwnProperty('KitenJikoku') ? timeStringToNumber(params.KitenJikoku) : 4 * 3600;
        this.stationInterval = params.hasOwnProperty('DiagramDgrYZahyouKyoriDefault') ? Number(params.DiagramDgrYZahyouKyoriDefault) : 60;
        this.enableOperation = params.hasOwnProperty('EnableOperation') ? params.EnableOperation === '1' : false;
        this.comment = params.hasOwnProperty('Comment') ? params.Comment.replace(/\\n/g, '\n') : '';
        this.stations = params.hasOwnProperty('Eki') ? params.Eki : [];
        this.trainTypes = params.hasOwnProperty('Ressyasyubetsu') ? params.Ressyasyubetsu : [new TrainType()];
        this.diagrams = params.hasOwnProperty('Dia') ? params.Dia : [new Diagram()];
    }
    toOudiaString() {
        return ('Rosen.\n' +
            'Rosenmei=' +
            this.name +
            '\n' +
            this.stations.map(station => station.toOudiaString()).join('') +
            this.trainTypes.map(trainType => trainType.toOudiaString()).join('') +
            this.diagrams.map(diagram => diagram.toOudiaString()).join('') +
            `KitenJikoku=${numberToTimeString(this.startTime, 'HMM')}\n` +
            `DiagramDgrYZahyouKyoriDefault=${this.stationInterval}\n` +
            `Comment=${this.comment.replace(/\n/g, '\\n')}\n` +
            '.\n');
    }
}
export class Station extends DiagramData {
    fromOudiaParams(params) {
        this.name = params.hasOwnProperty('Ekimei') ? params.Ekimei : '駅名未設定';
        this.abbrName = params.hasOwnProperty('EkimeiJikokuRyaku') ? params.EkimeiJikokuRyaku : '';
        switch (params.Ekijikokukeisiki) {
            case 'Jikokukeisiki_Hatsu':
                this.timetableStyle = {
                    arrival: [false, false],
                    departure: [true, true],
                };
                break;
            case 'Jikokukeisiki_Hatsuchaku':
                this.timetableStyle = {
                    arrival: [true, true],
                    departure: [true, true],
                };
                break;
            case 'Jikokukeisiki_KudariChaku':
                this.timetableStyle = {
                    arrival: [true, false],
                    departure: [false, true],
                };
                break;
            case 'Jikokukeisiki_NoboriChaku':
                this.timetableStyle = {
                    arrival: [false, true],
                    departure: [true, false],
                };
                break;
            case 'Jikokukeisiki_NoboriHatsuChaku':
                this.timetableStyle = {
                    arrival: [false, true],
                    departure: [true, true],
                };
                break;
            case 'Jikokukeisiki_KudariHatsuChaku':
                this.timetableStyle = {
                    arrival: [true, false],
                    departure: [true, true],
                };
                break;
            default:
                this.timetableStyle = {
                    arrival: [false, false],
                    departure: [true, true],
                };
                break;
        }
        this.isMain = params.hasOwnProperty('Ekikibo') ? params.Ekikibo === 'Ekikibo_Syuyou' : false;
        this.border = params.hasOwnProperty('Kyoukaisen') ? params.Kyoukaisen === '1' : false; // oud2ndV2では廃止
        this.visibleDiagramInfo = [];
        this.visibleDiagramInfo[0] = params.hasOwnProperty('DiagramRessyajouhouHyoujiKudari')
            ? params.DiagramRessyajouhouHyoujiKudari.replace('DiagramRessyajouhouHyouji_', '')
            : 'Origin';
        this.visibleDiagramInfo[1] = params.hasOwnProperty('DiagramRessyajouhouHyoujiNobori')
            ? params.DiagramRessyajouhouHyoujiNobori.replace('DiagramRessyajouhouHyouji_', '')
            : 'Origin';
        this.mainTrack = [];
        this.mainTrack[0] = params.hasOwnProperty('DownMain') ? Number(params.DownMain) : 0;
        this.mainTrack[1] = params.hasOwnProperty('UpMain') ? Number(params.UpMain) : 1;
        this.tracks = params.hasOwnProperty('EkiTrack2Cont') ? params.EkiTrack2Cont.tracks : StationTrackList.defaultTracks;
        this.outerTerminal = params.hasOwnProperty('OuterTerminal') ? params.OuterTerminal : null;
        this.brunchCoreStationIndex = params.hasOwnProperty('BrunchCoreEkiIndex') ? Number(params.BrunchCoreEkiIndex) : null;
        this.isBrunchOpposite = params.hasOwnProperty('BrunchOpposite') ? params.BrunchOpposite === '1' : false;
        this.loopOriginStationIndex = params.hasOwnProperty('LoopOriginEkiIndex') ? Number(params.LoopOriginEkiIndex) : null;
        this.isLoopOpposite = params.hasOwnProperty('LoopOpposite') ? params.LoopOpposite === '1' : false;
        this.visibleTimetableTrack = [];
        this.visibleTimetableTrack[0] = params.hasOwnProperty('JikokuhyouTrackDisplayKudari') ? params.JikokuhyouTrackDisplayKudari === '1' : false;
        this.visibleTimetableTrack[1] = params.hasOwnProperty('JikokuhyouTrackDisplayNobori') ? params.JikokuhyouTrackDisplayNobori === '1' : false;
        this.visibleDiagramTrack = params.hasOwnProperty('DiagramTrackDisplay') ? params.DiagramTrackDisplay === '1' : false;
        this.nextStaionDistance = params.hasOwnProperty('NextEkiDistance') ? Number(params.NextEkiDistance) : null;
        this.timetableTrackOmit = params.hasOwnProperty('JikokuhyouTrackOmit') ? params.JikokuhyouTrackOmit === '1' : false;
        this.operationLength = [];
        this.operationLength[0] = params.hasOwnProperty('JikokuhyouOperationOrigin') ? Number(params.JikokuhyouOperationOrigin) : 0;
        this.operationLength[1] = params.hasOwnProperty('JikokuhyouOperationTerminal') ? Number(params.JikokuhyouOperationTerminal) : 0;
        this.customTimetableStyle = {
            arrival: [false, false],
            departure: [true, true],
            trainNumber: [false, false],
            operationNumber: [false, false],
            trainType: [false, false],
            trainName: [false, false],
        };
        if (params.hasOwnProperty('JikokuhyouJikokuDisplayKudari')) {
            const s = params.JikokuhyouJikokuDisplayKudari.split(',');
            this.customTimetableStyle.arrival[0] = s[0] === 1;
            this.customTimetableStyle.departure[0] = s[1] === 1;
        }
        if (params.hasOwnProperty('JikokuhyouJikokuDisplayNobori')) {
            const s = params.JikokuhyouJikokuDisplayNobori.split(',');
            this.customTimetableStyle.arrival[1] = s[0] === 1;
            this.customTimetableStyle.departure[1] = s[1] === 1;
        }
        if (params.hasOwnProperty('JikokuhyouSyubetsuChangeDisplayKudari')) {
            const s = params.JikokuhyouSyubetsuChangeDisplayKudari;
            this.customTimetableStyle.trainNumber[0] = s[0] === 1;
            this.customTimetableStyle.operationNumber[0] = s[1] === 1;
            this.customTimetableStyle.trainType[0] = s[2] === 1;
            this.customTimetableStyle.trainName[0] = s[3] === 1;
        }
        if (params.hasOwnProperty('JikokuhyouSyubetsuChangeDisplayNobori')) {
            const s = params.JikokuhyouSyubetsuChangeDisplayNobori;
            this.customTimetableStyle.trainNumber[1] = s[0] === 1;
            this.customTimetableStyle.operationNumber[1] = s[1] === 1;
            this.customTimetableStyle.trainType[1] = s[2] === 1;
            this.customTimetableStyle.trainName[1] = s[3] === 1;
        }
    }
    toOudiaString() {
        return ('Eki.\n' +
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
            '.\n');
    }
    getTimetableStyle() {
        const n = (Number(this.timetableStyle.arrival[0]) << 3) +
            (Number(this.timetableStyle.arrival[1]) << 2) +
            (Number(this.timetableStyle.departure[0]) << 1) +
            Number(this.timetableStyle.departure[1]);
        switch (n) {
            case 3:
                return 'Jikokukeisiki_Hatsu';
            case 15:
                return 'Jikokukeisiki_Hatsuchaku';
            case 9:
                return 'Jikokukeisiki_KudariChaku';
            case 6:
                return 'Jikokukeisiki_NoboriChaku';
        }
        return 'Jikokukeisiki_Hatsu';
    }
    addTrack() {
        const lName = this.tracks[this.tracks.length - 1].name;
        const lAbbrName = this.tracks[this.tracks.length - 1].abbrName;
        const m1 = lName.match(/\d+/);
        const m2 = lAbbrName[0].match(/\d+/);
        const m3 = lAbbrName[0].match(/\d+/);
        let name = '1番線';
        const abbrName = ['1', ''];
        if (m1 !== null && Number.isInteger(Number(m1[0])))
            name = lName.replace(/\d+/, String(Number(m1[0]) + 1));
        if (m2 !== null && Number.isInteger(Number(m2[0])))
            abbrName[0] = lAbbrName[0].replace(/\d+/, String(Number(m2[0]) + 1));
        if (m3 !== null && Number.isInteger(Number(m3[0])))
            abbrName[1] = lAbbrName[1].replace(/\d+/, String(Number(m3[0]) + 1));
        this.tracks.push(new StationTrack({ name, abbrName }));
    }
}
export class StationTrack extends DiagramData {
    fromOudiaParams(params) {
        this.name = params.hasOwnProperty('TrackName') ? params.TrackName : '';
        this.abbrName = [];
        this.abbrName[0] = params.hasOwnProperty('TrackRyakusyou') ? params.TrackRyakusyou : '';
        this.abbrName[1] = params.hasOwnProperty('TrackNoboriRyakusyou') ? params.TrackNoboriRyakusyou : '';
    }
}
// EkiTrack2Contに相当. parseの過程で一時的に現れて消えてゆく
export class StationTrackList extends DiagramData {
    fromOudiaParams(params) {
        this.tracks = params.hasOwnProperty('EkiTrack2') ? params.EkiTrack2 : null;
    }
    static get defaultTracks() {
        return [new StationTrack({ name: '1番線', abbrName: ['1', ''] }), new StationTrack({ name: '2番線', abbrName: ['2', ''] })];
    }
}
// OuterTerminalに相当
export class OuterTerminal extends DiagramData {
    fromOudiaParams(params) {
        this.name = params.hasOwnProperty('OuterTerminalEkimei') ? params.OuterTerminalEkimei : '名称未設定';
        this.timetableName = params.hasOwnProperty('OuterTerminalJikokuRyaku') ? params.OuterTerminalJikokuRyaku : null;
        this.diagramName = params.hasOwnProperty('OuterTerminalDiaRyaku') ? params.OuterTerminalDiaRyaku : null;
    }
}
// Ressyasyubetsuに相当
export class TrainType extends DiagramData {
    fromOudiaParams(params) {
        this.name = params.hasOwnProperty('Syubetsumei') ? params.Syubetsumei : '新規種別';
        this.abbrName = params.hasOwnProperty('Ryakusyou') ? params.Ryakusyou : '新種';
        this.textColor = params.hasOwnProperty('JikokuhyouMojiColor') ? Color.from(params.JikokuhyouMojiColor) : new Color(0, 0, 0);
        this.fontIndex = params.hasOwnProperty('JikokuhyouFontIndex') ? Number(params.JikokuhyouFontIndex) : 0;
        this.backgroundColor = params.hasOwnProperty('JikokuhyouBackColor') ? Color.from(params.JikokuhyouBackColor[0]) : new Color(255, 255, 255); // DispPropの同名プロパティが列挙可能なせいでparams.JikokuhyouBackColorは配列になっちゃってる
        this.strokeColor = params.hasOwnProperty('DiagramSenColor') ? Color.from(params.DiagramSenColor) : new Color(0, 0, 0);
        this.lineStyle = params.hasOwnProperty('DiagramSenStyle') ? params.DiagramSenStyle.replace('SenStyle_', '') : 'Jissen';
        this.isBoldLine = params.hasOwnProperty('DiagramSenIsBold') ? params.DiagramSenIsBold === '1' : false;
        this.stopMark = params.hasOwnProperty('StopMarkDrawType') ? params.StopMarkDrawType === 'EStopMarkDrawType_DrawOnStop' : false;
        this.parentIndex = params.hasOwnProperty('ParentSyubetsuIndex') ? Number(params.ParentSyubetsuIndex) : null;
    }
    toOudiaString() {
        return ('Ressyasyubetsu.\n' +
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
            '.\n');
    }
}
// Diaに相当
export class Diagram extends DiagramData {
    fromOudiaParams(params) {
        this.name = params.hasOwnProperty('DiaName') ? params.DiaName : '新規ダイヤ';
        this.mainBackgroundColorIndex = params.hasOwnProperty('MainBackColorIndex') ? Number(params.MainBackColorIndex) : 0;
        this.subBackgroundColorIndex = params.hasOwnProperty('SubBackColorIndex') ? Number(params.SubBackColorIndex) : 0;
        this.backgroundPatternIndex = params.hasOwnProperty('BackPatternIndex') ? Number(params.BackPatternIndex) : 0;
        this.trains = [null, null];
        this.trains[0] = params.hasOwnProperty('Kudari') ? params.Kudari.trains || [] : [];
        this.trains[1] = params.hasOwnProperty('Nobori') ? params.Nobori.trains || [] : [];
    }
    toOudiaString() {
        return ('Dia.\n' +
            'DiaName=' +
            this.name +
            '\n' +
            'Kudari.\n' +
            this.trains[0].map(train => train.toOudiaString()).join('') +
            '.\n' +
            'Nobori.\n' +
            this.trains[1].map(train => train.toOudiaString()).join('') +
            '.\n' +
            '.\n');
    }
}
// Kudari, Noboriに相当. parseの過程で一時的に現れて消えてゆく
export class TrainList extends DiagramData {
    fromOudiaParams(params) {
        this.trains = params.Ressya;
    }
}
// Ressyaに相当
export class Train extends DiagramData {
    fromOudiaParams(params) {
        this.direction = params.hasOwnProperty('Houkou') ? (params.Houkou === 'Kudari' ? 0 : 1) : 0;
        this.type = params.hasOwnProperty('Syubetsu') ? Number(params.Syubetsu) : 0;
        this.number = params.hasOwnProperty('Ressyabangou') ? params.Ressyabangou : '';
        this.name = params.hasOwnProperty('Ressyamei') ? params.Ressyamei : '';
        this.count = params.hasOwnProperty('Gousuu') ? params.Gousuu : '';
        this.timetable = params.hasOwnProperty('EkiJikoku') ? StationTime.from(params.EkiJikoku) : new StationTime();
        this.note = params.hasOwnProperty('Bikou') ? params.Bikou : null;
        this.operations = params.hasOwnProperty('Operation') ? params.Operation : null;
    }
    toOudiaString() {
        return ('Ressya.\n' +
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
            '.\n');
    }
}
// DispPropに相当
export class DisplayProperty extends DiagramData {
    fromOudiaParams(params) {
        this.timetableFont = params.hasOwnProperty('JikokuhyouFont')
            ? params.JikokuhyouFont.map((value) => Font.from(value))
            : new Array(8).fill(0).map(() => new Font());
        this.timetableVFont = params.hasOwnProperty('JikokuhyouVFont') ? Font.from(params.JikokuhyouVFont) : new Font();
        this.diagramStationFont = params.hasOwnProperty('DiaEkimeiFont') ? Font.from(params.DiaEkimeiFont) : new Font();
        this.diagramTimeFont = params.hasOwnProperty('DiaJikokuFont') ? Font.from(params.DiaJikokuFont) : new Font();
        this.commentFont = params.hasOwnProperty('CommentFont') ? Font.from(params.CommentFont) : new Font();
        this.diagramTrainFont = params.hasOwnProperty('DiaRessyaFont') ? Font.from(params.DiaRessyaFont) : new Font();
        this.diagramTrainFont = params.hasOwnProperty('DiaRessyaFont') ? Font.from(params.DiaRessyaFont) : new Font();
        this.diagramTextColor = params.hasOwnProperty('DiaMojiColor') ? Color.from(params.DiaMojiColor) : new Color(0, 0, 0);
        this.diagramBackgroundColor = params.hasOwnProperty('DiaHaikeiColor') ? Color.from(params.DiaHaikeiColor) : new Color(255, 255, 255);
        this.diagramTrainColor = params.hasOwnProperty('DiaRessyaColor') ? Color.from(params.DiaRessyaColor) : new Color(0, 0, 0);
        this.diagramAxisColor = params.hasOwnProperty('DiaJikuColor') ? Color.from(params.DiaJikuColor) : new Color(191, 191, 191);
        this.stdOpeTimeLowerColor = params.hasOwnProperty('StdOpeTimeLowerColor') ? Color.from(params.StdOpeTimeLowerColor) : new Color(255, 191, 191);
        this.stdOpeTimeHigherColor = params.hasOwnProperty('StdOpeTimeHigherColor') ? Color.from(params.StdOpeTimeHigherColor) : new Color(191, 191, 255);
        this.stdOpeTimeUndefColor = params.hasOwnProperty('StdOpeTimeUndefColor') ? Color.from(params.StdOpeTimeUndefColor) : new Color(255, 255, 191);
        this.stdOpeTimeIllegalColor = params.hasOwnProperty('StdOpeTimeIllegalColor')
            ? Color.from(params.StdOpeTimeIllegalColor)
            : new Color(191, 191, 191);
        this.stationNameLength = params.hasOwnProperty('EkimeiLength') ? Number(params.EkimeiLength) : 6;
        this.timetableTrainWidth = params.hasOwnProperty('JikokuhyouRessyaWidth') ? Number(params.JikokuhyouRessyaWidth) : 5;
        this.anySecondIncDec1 = params.hasOwnProperty('AnySecondIncDec1') ? Number(params.AnySecondIncDec1) : 5;
        this.anySecondIncDec2 = params.hasOwnProperty('AnySecondIncDec2') ? Number(params.AnySecondIncDec2) : 15;
        this.visibleTrainName = params.hasOwnProperty('DisplayRessyamei') ? params.DisplayRessyamei === '1' : true;
        this.visibleOuterTerminalOriginSide = params.hasOwnProperty('DisplayOuterTerminalEkimeiOriginSide')
            ? params.DisplayOuterTerminalEkimeiOriginSide === '1'
            : false;
        this.visibleOuterTerminalTerminalSide = params.hasOwnProperty('DisplayOuterTerminalEkimeiTerminalSide')
            ? params.DisplayOuterTerminalEkimeiTerminalSide === '1'
            : false;
        this.visibleOuterTerminal = params.hasOwnProperty('DiagramDisplayOuterTerminal') ? params.DiagramDisplayOuterTerminal === '1' : false;
    }
    toOudiaString() {
        return ('DispProp.\n' +
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
            '.\n');
    }
}
// EkiJikoku
export class StationTime {
    constructor() {
        this.firstStationIndex = null;
        this.terminalStationIndex = null;
        this._data = [];
    }
    get data() {
        return this._data;
    }
    static from(oudString) {
        const result = new this();
        result._data = [];
        result.terminalStationIndex = 0;
        oudString.split(',').forEach((value, i) => {
            if (value === '')
                return;
            // value: 's;a/d$t'       's;a/$t'     's;d$t'      's$t'      's;a/d'      's;a/'      's;d'      's'
            //    s1: ['s;a/d', 't'] ['s;a/', 't'] ['s;d', 't'] ['s', 't'] ['s;a/d']    ['s;a/']    ['s;d']    ['s']
            //    s2: ['s', 'a/d']   ['s', 'a/']   ['s', 'd']   ['s']      ['s', 'a/d'] ['s', 'a/'] ['s', 'd'] ['s']
            //    s3: ['a', 'd']     ['a', '']     ['d']                   ['a', 'd']   ['a', '']   ['d']
            const s1 = value.split('$');
            const s2 = s1[0].split(';');
            const track = s1.length === 2 ? Number(s1[1]) : 0;
            const stopType = Number(s2[0]);
            if (stopType === 3)
                return;
            if (s2.length === 1) {
                result._data[i] = { stopType, arrival: null, departure: null, track };
                return;
            }
            const s3 = s2[1].split('/');
            const arrival = s3.length === 2 ? timeStringToNumber(s3.shift()) : null;
            const departure = s3[0] !== '' ? timeStringToNumber(s3[0]) : null;
            result._data[i] = { stopType, arrival, departure, track };
            result.terminalStationIndex = i;
        });
        result.firstStationIndex = result._data.findIndex(v => v);
        return result;
    }
    toOudiaString() {
        let result = '';
        for (let i = 0; i < this.firstStationIndex; i++) {
            result += ',';
        }
        for (let i = this.firstStationIndex; i < this.terminalStationIndex; i++) {
            if (!(i in this._data)) {
                result += '3';
            }
            else {
                result += this._data[i].stopType + ';';
                if (this._data[i].arrival !== null) {
                    result += numberToTimeString(this._data[i].arrival, 'HMM') + '/';
                }
                if (this._data[i].departure !== null) {
                    result += numberToTimeString(this._data[i].departure, 'HMM');
                }
            }
            result += ',';
        }
        return result;
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
};
//# sourceMappingURL=DiagramParser.js.map