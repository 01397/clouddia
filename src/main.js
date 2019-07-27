"use strict";

import { DiagramParser } from "./DiagramParser.js";
import App from "./App.js";


const ENCODING_TYPE = 'shift-jis';
let app = null;

document.addEventListener('DOMContentLoaded', () => {
    window.app = app = new App();
    const url = location.search.match(/(?<=url=)[^&]+/);
    let type = location.search.match(/(?<=type=)[^&]+/);
    type = type === null ? 'oud' : type[0];
    if (url) {
        if (type == 'oud') loadOudFileOnline(url[0]);

    } else {
        document.getElementById('fileSelector').addEventListener('change', evt => {
            loadOudFileLocal(evt.target.files[0]);
        });
        document.getElementById('fileRequester').addEventListener('click', () =>
            loadOudFileOnline(document.getElementById('fileURL').value)
        );
        const startMain = document.getElementById('start-main');
        startMain.addEventListener('dragover', evt => {
            evt.preventDefault();
            startMain.classList.add('drag');
        });
        startMain.addEventListener('dragleave', () => {
            startMain.classList.remove('drag');
        });
        startMain.addEventListener('drop', evt =>  {
            evt.preventDefault();
            startMain.classList.remove('drag');
            loadOudFileLocal(evt.dataTransfer.files[0]);
        });
    }
});

/**
 * あぁ〜端末上のouDiaファイルが入ってきたぁぁ。読み込んじゃうよぉお。。
 * @param {string} string ouDiaのファイルの文字列
 */
function loadOudFile(string) {
    app.data = DiagramParser.parseOudia(string);
    app.showTrainTimetable(0, 'Kudari');
}
function loadOudFileLocal(file) {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
        loadOudFile(reader.result, file.name);
    }, false);
    reader.readAsText(file, ENCODING_TYPE);
}
function loadOudFileOnline(requestURL) {
    const url = 'http://soasa.starfree.jp/fileRequest.php?url=' + requestURL;
    fetch(url, { mode: 'cors' })
        .then(response => response.blob())
        .then(blob => new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsText(blob, 'shift-jis');
        }))
        .then(text => loadOudFile(text, 'Web上のファイル'))
        .catch(err => console.error(err));
}