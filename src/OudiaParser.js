"use strict";

// DiagramParser.js (module)
// oudiaのテキストファイルをJSONオブジェクトにしまっせ。
export default class OudiaParser {
    // ただObjectに変換するだけ
    static parse(oudString) {
        return oud_oujson(oudString.split(/\r\n|\r|\n/), 0);
    }
    // さらに列車時刻の文字列も変換する
    static parse2(oudString) {
        const json = oud_oujson(oudString.split(/\r\n|\r|\n/), 0);
        const stationLength = json.Rosen[0].Eki.length;
        json.Rosen[0].Dia.forEach(dia => {
            dia.Kudari[0].Ressya.forEach(ressya => ressya.timetable = parseRessyaString(ressya, stationLength));
            dia.Nobori[0].Ressya.forEach(ressya => ressya.timetable = parseRessyaString(ressya, stationLength));
        });
        return json;
    }

}

// 再帰を用いてObjectを組み上げていく
function oud_oujson(lines, count = 0) {
    const local = {};
    for (let i = count; i < lines.length; i++) {
        if (lines[i].includes('=')) {
            const l = lines[i].indexOf('=');
            const key = lines[i].slice(0, l);
            const value = lines[i].slice(l + 1);
            if (key in local) console.warn(i + '行目: ' + key + 'の上書きが発生');
            local[key] = value;
        } else if (lines[i] == '.') {
            return [local, i];
        } else if (/.+\.$/.test(lines[i])) {
            const key = lines[i].slice(0, -1);
            const [val, j] = oud_oujson(lines, i + 1);
            if (key in local) {
                local[key].push(val);
            } else {
                local[key] = [val];
            }
            i = j;
        } else if (lines[i] !== '') {
            console.warn(i + '行目: ' + lines[i] + '不明な文字列');
        }
    }
    return local;
}

// RessyaのEkiJikokuを扱いやすく。
function parseRessyaString(ressya, stationLength) {
    const array = ressya.EkiJikoku.split(',').map(str => {
        if (str === "") return null;
        const [type, times] = str.split(';');
        const stopType = Number(type);
        let arrival = null;
        let departure = null;
        if (times) {
            if (times.includes('/')) {
                let s = times.split('/');
                arrival = HHMMtoMinutes(s[0]);
                departure = HHMMtoMinutes(s[1]);
            } else {
                departure = HHMMtoMinutes(times);
            }
        }
        return { stopType, departure, arrival };
    });
    for (let i = array.length; i < stationLength; i++) {
        array.push(null);
    }
    return array;
}
function HHMMtoMinutes(HHMMstring) {
    if (!HHMMstring || HHMMstring === "") return null;
    return HHMMstring.slice(0, -2) * 60 + HHMMstring.slice(-2) * 1;
}

