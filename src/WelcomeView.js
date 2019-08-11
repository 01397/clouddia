'use strict';

import View from "./View.js";

export default class WelcomeView extends View{
  constructor(app) {
    super(app);
  }
  render(){
    this.window = document.getElementById('mainWindow');
    this.window.innerHTML = `<div class="startPage">
    <h1>CloudDiaへようこそ!!</h1>
    <div id="start-main">
        <h3>端末内のファイルを使う</h3>
        <label>
            <div id="start-openButton">ファイルを選択</div><input type="file" id="fileSelector">
        </label>
        <div class="start-caption">枠内にファイルをドロップしてもOKです</div>
        <div id="main-or">OR</div>
        <h3>Web上のファイルを使う</h3>
        <div id="start-urlSection">
            <input type="url" id="fileURL" placeholder="URLを入力" /><button id="fileRequester">開く</button>
        </div>
        <div class="start-caption">直リンク禁止のファイルは、まず公開者に許可を取ることを推奨します</div>
    </div>
    <h2>これは何？</h2>
    <p>
        oudiaファイルをブラウザで表示するものです。<br />
        今の所はちゃんと表示できるようにするので精一杯。。。<br/>
        oud2対応とか編集とかまだ無理...
    </p>
    <h2>Web上のファイルについて</h2>
    <p>
        URL末尾に<code>?url=[oudiaファイルのURL]</code>をつけたアドレスでも開けます。<br/>
        ただし、ファイル管理者の許可なくこのアドレスを公開しないでください。<br/>
        相手方のサーバーにも負担をかけるので...。
    </p>
    <h2>注意</h2>
    <p>
        - Google Chromeがおすすめです！Safariだとちょっと動作がカクつくかも。Edgeは知らなーい<br />
        - 気まぐれに更新してます。まだバグ多いかもね〜<br />
        - 未完成品なので何が起きても全て自己責任で！<br />
        - ついったー <a href="https://twitter.com/01_397">大井さかな(@01_397)</a><br/>
        - そーすこーど <a href="https://github.com/01397/clouddia">GitHub</a>
    </p>
    <h2>更新履歴</h2><div class="start-release"><div>` +
    `
    2018.8.12
      [new]ダイヤとか時刻押すと、列車詳細パネルが右側に出るようになった！

    2018.8.1
      [update]ダイヤグラムの表示を高速化！
      [update]ダイヤグラムへの列車番号、列車名表示に対応！

    2018.7.29
      [update]スマホ対応！ダイヤグラムのタッチ操作対応！

    2018.7.28
      [new]駅時刻表が追加されました！

    2019.7.27
      [update]ダイヤグラムが拡大縮小可能に！

    2019.7.27
      [new]試しに公開してみたよ`
      .replace(/^\W*$/gm, '</div></div><div>')
      .replace(/^\W*(20.*?)\n/gm, '<div class="start-date">$1</div><div>')
      .replace(/\[update\](.+)$/gm, '<div><span class="start-relaeseLabel start-update">更 新</span>$1</div>')
      .replace(/\[new\](.+)$/gm, '<div><span class="start-relaeseLabel start-new">新機能</span>$1</div>')
      .replace(/\[fixed\](.+)$/gm, '<div><span class="start-relaeseLabel start-fixed">修 正</span>$1</div>')
       + '</div></div></div>';

    document.getElementById('fileSelector').addEventListener('change', evt => {
      this.app.loadOudFileLocal(evt.target.files[0]);
    });
    document.getElementById('fileRequester').addEventListener('click', () =>
      this.app.loadOudFileOnline(document.getElementById('fileURL').value)
    );
    const startMain = document.getElementById('start-main');
    startMain.addEventListener('dragover', evt => {
      evt.preventDefault();
      startMain.classList.add('drag');
    });
    startMain.addEventListener('dragleave', () => {
      startMain.classList.remove('drag');
    });
    startMain.addEventListener('drop', evt => {
      evt.preventDefault();
      startMain.classList.remove('drag');
      this.app.loadOudFileLocal(evt.dataTransfer.files[0]);
    });
  }
  finish() {
    this.window.classList.remove('startPage');
  }

}