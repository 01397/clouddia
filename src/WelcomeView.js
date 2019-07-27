'use strict';

import View from "./View.js";

export default class WelcomeView extends View{
  constructor(app) {
    super(app);
  }
  render(){
    this.window = document.getElementById('mainWindow');
    this.window.classList.add('startPage');
    this.window.innerHTML = `
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
        oudiaファイルをブラウザで見たいな、と思った人が作った何かです。<br />
        今の所はちゃんと表示できるようにするので精一杯。
    </p>
    <h2>サービス名とロゴについて</h2>
    <p>
        Cloudなんて名前はついてるけど、特にクラウドサービスはしてない笑<br />
        まぁいい名前があれば変えるかもしれないし、変えないかもしれない...?<br />
        お遊びで作ったCloudDiaなんてロゴを作ってしまったとこから開発スタート。<br />
        そこそこ気に入ってるからここにも貼っちゃお！<br />
        SVGのコードを手打ちして作ったんだよ、頭おかしいね笑<br />
        <img src="img/logo.svg" alt="CloudDiaのロゴ画像" width="96" height="96"><br />
    </p>
    <h2>Web上のファイルについて</h2>
    <p>
        URL末尾に<code>?url=[oudiaファイルのURL]</code>をつけたアドレスでも開けます。<br/>
        ただし、ファイル管理者の許可なくこのアドレスを公開しないでください。<br/>
        相手方のサーバーにも負担をかけるので...。
    </p>
    <h2>注意</h2>
    <p>
        * Google Chromeを強く推奨するぜ！Safariだとちょっと動作がカクつくかも。Edgeは知らん<br />
        * まだまだ未完成だから、気まぐれに更新するしバグだらけだと思うよ〜何が起きても全て自己責任で！<br />
        * ついったー: <a href="https://twitter.com/01_397">大井さかな(@01_397)</a>
        * そーすこーど: <a href="https://github.com/01397/clouddia">GitHub</a>
    </p>`;
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

}