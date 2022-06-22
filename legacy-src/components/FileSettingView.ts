import App from '../App.js'
import {
  createTimeField,
  h,
  numberToTimeString,
  timeStringToNumber,
  createTextField,
  createCheckbox,
  Font,
} from '../Util.js'
import View from './View.js'
export default class FileSettingView extends View {
  constructor(app: App) {
    super(app, 'FileSetting')
    const data = this.app.data
    const railwayNameField = h('input', {
      class: 'form-text fs-flex',
      type: 'text',
      placeholder: '〇〇線',
      value: data.railway.name,
    })
    railwayNameField.addEventListener('change', e => (data.railway.name = (e.currentTarget as HTMLInputElement).value))
    const railwayCommentField = h('textarea', { class: 'form-text-multiline fs-flex' }, data.railway.comment)
    railwayCommentField.addEventListener(
      'change',
      e => (data.railway.comment = (e.currentTarget as HTMLTextAreaElement).value)
    )
    const directionNameField0 = h('input', {
      class: 'form-text fs-flex',
      type: 'text',
      placeholder: '下り',
      value: data.railway.directionName[0],
    })
    directionNameField0.addEventListener('change', e => {
      const value = (e.currentTarget as HTMLTextAreaElement).value
      data.railway.directionName[0] = value == '' ? '下り' : value
      document.getElementById('sidebar-label-inbound')!.textContent = data.railway.directionName[0]
    })
    const directionNameField1 = h('input', {
      class: 'form-text fs-flex',
      type: 'text',
      placeholder: '上り',
      value: data.railway.directionName[1],
    })
    directionNameField1.addEventListener('change', e => {
      const value = (e.currentTarget as HTMLTextAreaElement).value
      data.railway.directionName[1] = value == '' ? '上り' : value
      document.getElementById('sidebar-label-outbound')!.textContent = data.railway.directionName[1]
    })
    const startTimeField = createTimeField(
      numberToTimeString(data.railway.startTime, 'HH MM SS'),
      null,
      e => (data.railway.startTime = timeStringToNumber((e.currentTarget as HTMLTextAreaElement).value))
    )
    const oudiaSettings: Element[] = []
    const createFontRow = (font: Font, label: string) => {
      return h('div', { class: 'form-row' }, [
        h('div', { class: 'form-label' }, label),
        createTextField(font.family, '書体', null, e => (font.family = (e.currentTarget as HTMLTextAreaElement).value)),
        createTextField(
          font.height + '',
          '',
          'fs-number',
          e => (font.height = Number((e.currentTarget as HTMLTextAreaElement).value))
        ),
        h('label', { class: 'fs-label' }, [
          createCheckbox(font.bold, null, e => (font.bold = (e.currentTarget as HTMLInputElement).checked)),
          h('div', { class: 'fs-text' }, '太字'),
        ]),
        h('label', { class: 'fs-label' }, [
          createCheckbox(font.italic, null, e => (font.italic = (e.currentTarget as HTMLInputElement).checked)),
          h('div', { class: 'fs-text' }, '斜体'),
        ]),
      ])
    }
    oudiaSettings.push(
      ...data.displayProperty.timetableFont.map((font, i) => createFontRow(font, '時刻表ビュー ' + (i + 1))),
      createFontRow(data.displayProperty.timetableVFont, '時刻表ビュー 縦書き'),
      createFontRow(data.displayProperty.diagramStationFont, 'ダイヤグラムビュー 駅名'),
      createFontRow(data.displayProperty.diagramTimeFont, 'ダイヤグラムビュー 時刻'),
      createFontRow(data.displayProperty.diagramTrainFont, 'ダイヤグラムビュー 列車'),
      createFontRow(data.displayProperty.commentFont, 'コメント')
    )

    const content = h('div', { class: 'fs-1col-container' }, [
      h('div', { class: 'fs-section fs-label6' }, [
        h('div', { class: 'fs-section-header' }, 'ファイル'),
        h('div', { class: 'form-row' }, [h('div', { class: 'form-label' }, '路線名'), railwayNameField]),
        h('div', { class: 'form-row' }, [h('div', { class: 'form-label' }, 'コメント'), railwayCommentField]),
        h('div', { class: 'form-row' }, [
          h('div', { class: 'form-label' }, '路線方向名'),
          directionNameField0,
          directionNameField1,
        ]),
        h('div', { class: 'form-row' }, [h('div', { class: 'form-label' }, '1日の始まり'), startTimeField]),
      ]),
      h('div', { class: 'fs-section fs-label12' }, [
        h('div', { class: 'fs-section-header' }, 'OuDiaの設定'),
        ...oudiaSettings,
      ]),
    ])
    this.element.append(content)
  }
  public finish(): void {
    return
  }
}
