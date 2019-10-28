import { createButton, createTextField, h } from '../Util.js';
import View from './View.js';
import { DiagramFile } from '../DiagramParser.js';
export default class StartView extends View {
    constructor(app) {
        super(app, 'Start');
        const fileSelector = h('input', { type: 'file', class: 'start-file' });
        fileSelector.addEventListener('change', (e) => {
            const target = e.currentTarget;
            this.loadLocalFile(target.files[0]);
        });
        const createNewButton = createButton('新規作成', 'form-button-fill start-file-button', () => this.app.initialize(new DiagramFile()));
        const fileSelectLabel = h('div', { class: 'form-button form-button-fill start-file-button' }, 'ファイルを選ぶ');
        const urlField = createTextField('', 'oudiaファイルのURL', 'start-drop-url-field');
        const urlButton = createButton('開く', null, () => this.app.loadOnlineFile(urlField.value));
        const dropArea = h('div', { class: 'start-drop' }, [
            h('div', { class: 'start-drop-caption' }, '新しいダイヤグラムを作ります'),
            h('label', { class: 'start-file-label' }, createNewButton),
            h('div', { class: 'start-drop-caption' }, '枠内へファイルをドロップしても読み込めます'),
            h('label', { class: 'start-file-label' }, [fileSelectLabel, fileSelector]),
            h('div', { class: 'start-drop-caption' }, '直リンク禁止ファイルの閲覧は推奨しません'),
            h('div', { class: 'start-drop-url-wrapper' }, [urlField, urlButton]),
        ]);
        dropArea.addEventListener('dragover', (evt) => {
            evt.preventDefault();
            dropArea.classList.add('drag');
        });
        dropArea.addEventListener('dragleave', () => {
            dropArea.classList.remove('drag');
        });
        dropArea.addEventListener('drop', (evt) => {
            evt.preventDefault();
            dropArea.classList.remove('drag');
            this.loadLocalFile(evt.dataTransfer.files[0]);
        });
        const content = h('div', { class: 'start-container' }, [
            h('img', {
                class: 'start-logo',
                src: './img/logo_horizontal.svg',
                alt: 'CloudDia',
            }),
            dropArea,
            h('div', { class: 'start-readme' }, [
                h('h1', { class: 'start-readme-heading' }, 'これは？'),
                h('p', { class: 'start-readme-paragraph' }, 'ブラウザ上で時刻表ファイルを見れたらいいなぁ〜という気持ちを込めて開発中の作品。OuDia, OuDiaSecondのファイルを表示することが多分できます。web上のファイルは"http://onemu.starfree.jp/clouddia/?url=[時刻表ファイルのURL]"で開くこともできます。'),
                h('h1', { class: 'start-readme-heading' }, '注意事項'),
                h('p', { class: 'start-readme-paragraph' }, '編集・保存機能は作りかけなのに公開しちゃってます。動作に期待しないでください(涙)'),
                h('p', { class: 'start-readme-paragraph' }, 'Google Chromeからの閲覧を推奨します。'),
                h('p', { class: 'start-readme-paragraph' }, 'スマホ対応は微妙です、いつかやりたい。せめてタブレット対応。'),
                h('p', { class: 'start-readme-paragraph' }, 'GoogleアナリティクスによってCookieを利用した利用状況の収集をしています。'),
                h('p', { class: 'start-readme-paragraph' }, [
                    document.createTextNode('Twitter: '),
                    h('a', { href: 'https://twitter.com/01_397' }, '大井さかな(@01_397)'),
                ]),
                h('p', { class: 'start-readme-paragraph' }, [
                    document.createTextNode('ソースコード: '),
                    h('a', { href: 'https://github.com/01397/clouddia' }, 'GitHub'),
                ]),
                h('p', { class: 'start-readme-paragraph' }, [
                    document.createTextNode('バージョン: v' + this.app.version + ' '),
                    h('a', {
                        href: 'https://github.com/01397/clouddia/releases',
                        target: '_blank',
                    }, '更新履歴(GitHub)'),
                ]),
            ]),
        ]);
        this.element.appendChild(content);
    }
    finish() {
        return;
    }
    loadLocalFile(file) {
        const name = file.name;
        const reader = new FileReader();
        reader.addEventListener('load', () => this.app.loadOudia(reader.result, name), false);
        reader.readAsText(file, 'shift-jis');
    }
}
//# sourceMappingURL=StartView.js.map