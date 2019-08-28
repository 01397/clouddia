import View from './View.js';
import App from '../App.js';
import { h, createTimeField, numberToTimeString, timeStringToNumber } from '../Util.js';
export default class FileSettingView extends View {
  constructor(app: App) {
    super(app, 'FileSetting');
    const data = this.app.data;
    const railwayNameField = h('input', { class: 'form-text fs-flex', type: "text", placeholder: "〇〇線", value: data.railway.name });
    railwayNameField.addEventListener('change', (e) => data.railway.name = (e.currentTarget as HTMLInputElement).value);
    const railwayCommentField = h('textarea', { class: 'form-text-multiline fs-flex' }, data.railway.comment);
    railwayCommentField.addEventListener('change', (e) => data.railway.comment = (e.currentTarget as HTMLTextAreaElement).value);
    const directionNameField0 = h('input', { class: 'form-text fs-flex', type: "text", placeholder: "下り", value: data.railway.directionName[0] });
    directionNameField0.addEventListener('change', (e) => data.railway.directionName[0] = (e.currentTarget as HTMLTextAreaElement).value);
    const directionNameField1 = h('input', { class: 'form-text fs-flex', type: "text", placeholder: "上り", value: data.railway.directionName[1] });
    directionNameField1.addEventListener('change', (e) => data.railway.directionName[1] = (e.currentTarget as HTMLTextAreaElement).value);
    const startTimeField = createTimeField(
      numberToTimeString(data.railway.startTime, 'HH MM SS'),
      null,
      (e) => data.railway.startTime = timeStringToNumber((e.currentTarget as HTMLTextAreaElement).value),
    );

    const content = h('div', { class: 'fs-1col-container' }, [
      h('div', { class: 'fs-section fs-label6' }, [
        h('div', { class: 'fs-section-header' }, 'ファイル'),
        h('div', { class: 'form-row' }, [
          h('div', { class: 'form-label' }, '路線名'),
          railwayNameField,
        ]),
        h('div', { class: 'form-row' }, [
          h('div', { class: 'form-label' }, 'コメント'),
          railwayCommentField,
        ]),
        h('div', { class: 'form-row' }, [
          h('div', { class: 'form-label' }, '路線方向名'),
          directionNameField0,
          directionNameField1
        ]),
        h('div', { class: 'form-row' }, [
          h('div', { class: 'form-label' }, '1日の始まり'),
          startTimeField,
        ])
      ])
    ])
    this.element.append(content);
  }
}