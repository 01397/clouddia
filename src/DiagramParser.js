"use strict";

// DiagramParser.js (module)
// oudiaのテキストファイルをJSONオブジェクトにしまっせ。

export const DiagramParser = {
    parseOudia: (oudString) => {
        const json = oud_oujson(oudString.split(/\r\n|\r|\n/), 0);
        const stationLength = json.Rosen[0].Eki.length;
        json.Rosen[0].Dia.forEach(dia => {
            dia.Kudari[0].Ressya.forEach(ressya => ressya.timetable = parseRessyaString(ressya, stationLength));
            dia.Nobori[0].Ressya.forEach(ressya => ressya.timetable = parseRessyaString(ressya, stationLength));
        });
        return json;
    },
    oudiaToOuJSON: (oudString) => {
        return oud_oujson(oudString.split(/\r\n|\r|\n/), 0);
    }
};

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
        } else {
            console.warn(i + '行目: ' + lines[i] + 'って何だろう？');
        }
    }
    return local;
}

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

