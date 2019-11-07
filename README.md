![CloudDia](dist/img/logo_horizontal.svg "CloudDia")

## 概要
鉄道のダイヤグラムをWeb上で表示、編集するソフトウェアです。

OuDiaファイル(.oud), OuDiaSecondファイル(.oud2)を開くことができ、列車時刻表や駅時刻表、ダイヤグラムの図を表示できます。また、編集したダイヤグラムをOudia形式(.oud)で保存することもできます。ローカルファイルだけでなく、Web上のファイルも開けます。

## 環境
Chromeを推奨しています。おそらく、Edge, Firefox, Safariの最新版でも動作すると思います。Internet Explorerはサポートしていません。

## 試す
[http://onemu.starfree.jp/clouddia/](http://onemu.starfree.jp/clouddia/)で公開しています。

## DiagramParser.js
[DiagramParser.js](dist/js/DiagramParser.js) を用いてOudia, OudiaSecondのファイルをロードするのに使うことができます。DiagramParser.jsは[Util.js](dist/js/Util.js)に依存しているのでDiagramParser.jsとUtil.jsは同じディレクトリに含める必要があります。もちろん[Typescript版](src)もあります。
```javascript
import DiagramParser from './DiagramParser.js';
const parser = new DiagramParser();
parser
  .parse(oudiaText)
  .then(diagram => {
    console.log('路線名: ' + diagram.railway.name);
    console.log('種別一覧: ' + diagram.railway.trainTypes.map(type => type.name).join(', '))
  })
  .catch(err => console.error('パースできなかったよ(ToT).', err));
```

## 作者
Twitter [大井さかな (@01_397)](https://twitter.com/01_397)
