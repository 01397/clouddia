import App from '../App.js';
import {
  Color,
  createButton,
  createCheckbox,
  createColorField,
  createLineStyleField,
  createTextField,
  DASH_ARRAY_STYLE,
  h,
} from '../Util.js';
import View from './View.js';
import { TrainType } from '../DiagramParser.js';

export default class TrainTypeSettingView extends View {
  private rightContainer: Element;
  private svgElement: Element;
  private hoverElement: Element | null;
  constructor(app: App) {
    super(app, 'FileSetting');
    this.hoverElement = null;
    this.svgElement = h(
      'svg',
      { class: 'fs-typelist' },
      null,
      null,
      'http://www.w3.org/2000/svg'
    );
    this.svgElement.addEventListener('mousemove', (e: MouseEvent) => {
      const y = e.offsetY;
      if (this.hoverElement !== null)
        this.hoverElement.classList.remove('hover');
      const target =
        this.svgElement.querySelectorAll('g.fs-typelist-item')[
          Math.floor(y / 36)
        ];
      if (!target) return;
      this.hoverElement = target;
      target.classList.add('hover');
    });
    this.svgElement.addEventListener('mouseout', (e: MouseEvent) => {
      if (this.hoverElement !== null)
        this.hoverElement.classList.remove('hover');
    });
    this.svgElement.addEventListener('click', (e: MouseEvent) => {
      this.edit(Math.floor(e.offsetY / 36));
    });
    this.rightContainer = h(
      'div',
      { class: 'fs-right-container' },
      '列車種別が選択されていません'
    );
    const addButton = h(
      'div',
      { class: 'fs-typelist-add form-button form-button-fill' },
      '＋種別追加',
      () => this.append()
    );
    this.element.appendChild(
      h('div', { class: 'fs-2cols-container' }, [
        h('div', { class: 'fs-left-container' }, [this.svgElement, addButton]),
        this.rightContainer,
      ])
    );
    this.updateList();
  }
  public finish(): void {
    return;
  }
  private updateList() {
    const typeList = this.app.data.railway.trainTypes;
    this.svgElement.setAttribute('height', String(36 * typeList.length));
    this.svgElement.innerHTML = '';
    this.svgElement.append(
      ...typeList.map((trainType, i: number) =>
        h(
          'g',
          {
            class: 'fs-typelist-item',
            style: `transform:translate(0, ${36 * i}px)`,
          },
          [
            h(
              'path',
              {
                d: 'M8 30.5 l216 0 l12 -24 l56 0',
                stroke: trainType.strokeColor.toHEXString(),
                'stroke-dasharray': DASH_ARRAY_STYLE[trainType.lineStyle],
                'stroke-width': trainType.isBoldLine ? 3 : 1,
              },
              '',
              null,
              'http://www.w3.org/2000/svg'
            ),
            h(
              'text',
              {
                x: 8,
                y: 26,
                fill: trainType.textColor.toHEXString(),
                class: 'fs-typelist-name',
              },
              trainType.name,
              null,
              'http://www.w3.org/2000/svg'
            ),
            h(
              'text',
              {
                x: 264,
                y: 26,
                fill: trainType.textColor.toHEXString(),
                class: 'fs-typelist-abbr',
                'text-anchor': 'middle',
              },
              trainType.abbrName,
              null,
              'http://www.w3.org/2000/svg'
            ),
          ],
          null,
          'http://www.w3.org/2000/svg'
        )
      )
    );
  }
  private edit(trainTypeIndex: number) {
    const trainType = this.app.data.railway.trainTypes[trainTypeIndex];
    const content = [
      h('div', { class: 'fs-section fs-label5' }, [
        h('div', { class: 'fs-section-header' }, '表示'),
        h('div', { class: 'form-row' }, [
          h('div', { class: 'form-label' }, '種別名'),
          createTextField(trainType.name, '', '', null, (e) => {
            const value = (e.currentTarget as HTMLInputElement).value;
            this.svgElement.querySelectorAll('.fs-typelist-name')[
              trainTypeIndex
            ].textContent = value;
            trainType.name = value;
          }),
        ]),
        h('div', { class: 'form-row' }, [
          h('div', { class: 'form-label' }, '種別略称'),
          createTextField(trainType.abbrName, '', '', null, (e) => {
            const value = (e.currentTarget as HTMLInputElement).value;
            this.svgElement.querySelectorAll('.fs-typelist-abbr')[
              trainTypeIndex
            ].textContent = value;
            trainType.abbrName = value;
          }),
        ]),
        h('div', { class: 'form-row' }, [
          h(
            'div',
            { class: 'form-label', id: 'fs-traintype-color-text' },
            '文字色'
          ),
          createColorField(trainType.textColor.toHEXString(), '', (e) => {
            trainType.textColor = Color.from(
              (e.currentTarget as HTMLInputElement).value
            );
            this.updateList();
          }),
        ]),
        h('div', { class: 'form-row' }, [
          h('div', { class: 'form-label' }, '線色'),
          createColorField(trainType.strokeColor.toHEXString(), '', (e) => {
            trainType.strokeColor = Color.from(
              (e.currentTarget as HTMLInputElement).value
            );
            this.updateList();
          }),
          createButton('文字色に揃える', '', () => {
            trainType.strokeColor = trainType.textColor;
            this.updateList();
            this.edit(trainTypeIndex);
          }),
        ]),
        h('div', { class: 'form-row' }, [
          h('div', { class: 'form-label' }, '線スタイル'),
          createLineStyleField(trainType.lineStyle, '', (value) => {
            trainType.lineStyle = value;
            this.updateList();
          }),
        ]),
        h('div', { class: 'form-row' }, [
          h('div', { class: 'form-label' }, '太線'),
          createCheckbox(trainType.isBoldLine, '', (e) => {
            trainType.isBoldLine = (
              e.currentTarget as HTMLInputElement
            ).checked;
            this.updateList();
          }),
        ]),
        h('div', { class: 'form-row' }, [
          createButton('複製', null, () => {
            this.copy(trainTypeIndex);
          }),
          createButton('削除', 'form-button-red', () => {
            this.remove(trainTypeIndex);
          }),
        ]),
      ]),
    ];
    this.rightContainer.innerHTML = '';
    this.rightContainer.append(...content);
  }
  private append() {
    const trainTypeList = this.app.data.railway.trainTypes;
    trainTypeList.push(new TrainType());
    this.updateList();
    this.edit(trainTypeList.length - 1);
  }
  private copy(index: number) {
    const trainTypeList = this.app.data.railway.trainTypes;
    trainTypeList.splice(index, 0, trainTypeList[index].clone());
    this.updateList();
    this.edit(index);
  }
  private remove(index: number) {
    const trainTypeList = this.app.data.railway.trainTypes;
    trainTypeList.splice(index, 1);
    this.updateList();
    this.edit(index);
  }
}
