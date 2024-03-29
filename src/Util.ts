import { MenuItem } from './App';

// DOM生成。
export const h = (
  tag: string,
  attr: object | null = null,
  body: string | number | Node | Node[] | null = null,
  onclick: null | ((e: Event) => void) = null,
  ns?: string
): Element => {
  const element =
    ns === undefined
      ? document.createElement(tag)
      : document.createElementNS(ns, tag);
  if (attr != null) {
    for (const key in attr) {
      if (attr.hasOwnProperty(key)) {
        element.setAttribute(key, attr[key]);
      }
    }
  }
  if (onclick !== null) {
    element.addEventListener('click', onclick, {
      passive: true,
      capture: false,
    });
  }
  if (typeof body === 'string') {
    element.textContent = body;
  } else if (typeof body === 'number') {
    element.textContent = String(body);
  } else if (body instanceof Node) {
    element.appendChild(body);
  } else if (body instanceof Array) {
    element.append(...body);
  } else if (body !== null) {
    console.warn('この中身は想定してない！！\n' + body);
  }
  return element;
};

export const createTimeField = (
  value: string,
  className: string | null = null,
  onchange?: (e: Event) => void
): HTMLInputElement => {
  const field = h('input', {
    class: 'form-time ' + (className == null ? '' : ' ' + className),
    value,
    type: 'text',
  }) as HTMLInputElement;
  field.addEventListener('input', (e) => timeFieldInput(field, e));
  field.addEventListener('keydown', (e) => timeFieldKeydown(field, e));
  field.addEventListener('blur', (e) => timeFieldBlur(field));
  if (onchange) {
    field.addEventListener('change', onchange);
    field.addEventListener('blur', onchange);
    // 入力しながら
    field.addEventListener('input', (e) => {
      if (timeStringCheck(field.value)) onchange(e);
    });
    // 上下キー用
    field.addEventListener('keydown', (e) => {
      if (timeStringCheck(field.value)) onchange(e);
    });
  }
  return field;
};

export const createTextField = (
  value: string,
  placeholder = '',
  className: string | null = null,
  onchange: null | ((e: Event) => void) = null,
  oninput: null | ((e: Event) => void) = null
): HTMLInputElement => {
  const field = h('input', {
    class: 'form-text ' + (className !== null ? className : ''),
    value,
    type: 'text',
    placeholder,
  }) as HTMLInputElement;
  field.addEventListener('focus', () => field.select());
  field.addEventListener('keydown', (e) => e.stopPropagation());
  if (onchange !== null) field.addEventListener('change', onchange);
  if (oninput !== null) field.addEventListener('input', oninput);
  return field;
};

export const createMultilineTextField = (
  value: string,
  placeholder = '',
  className: string | null = null,
  onchange?: (e: Event) => void
): HTMLTextAreaElement => {
  const field = h(
    'textarea',
    {
      class:
        'form-text-multiline fs-flex' +
        (className == null ? '' : ' ' + className),
      placeholder,
    },
    value
  ) as HTMLTextAreaElement;
  field.addEventListener('keydown', (e) => e.stopPropagation());
  if (onchange) field.addEventListener('change', onchange);
  return field;
};

export const createCheckbox = (
  checked: boolean,
  className: string | null = null,
  onchange?: (e: Event) => void
): HTMLInputElement => {
  const checkbox = h('input', {
    class: 'form-checkbox' + (className == null ? '' : ' ' + className),
    type: 'checkbox',
  }) as HTMLInputElement;
  checkbox.checked = checked;
  if (onchange) checkbox.addEventListener('change', onchange);
  return checkbox;
};

export const createRadio = (
  checked: boolean,
  name?: string,
  className: string | null = null,
  onchange?: (e: Event) => void
): HTMLInputElement => {
  const radio = h('input', {
    class: 'form-radio' + (className == null ? '' : ' ' + className),
    type: 'radio',
    name,
  }) as HTMLInputElement;
  radio.checked = checked;
  if (onchange) radio.addEventListener('change', onchange);
  return radio;
};

export const createButton = (
  value: string,
  className: string | null = null,
  onclick?: (e: Event) => void
): HTMLInputElement => {
  return h(
    'input',
    {
      class: 'form-button' + (className == null ? '' : ' ' + className),
      type: 'button',
      value,
    },
    null,
    onclick
  ) as HTMLInputElement;
};

export const createColorField = (
  value: string,
  className: string | null = null,
  onchange?: (e: Event) => void
): HTMLInputElement => {
  const colorField = h('input', {
    type: 'color',
    value,
    class: 'form-color' + (className == null ? '' : ' ' + className),
  }) as HTMLInputElement;
  // const label = h(
  //   'label',
  //   { class: 'form-color' + (className == null ? '' : ' ' + className), tabindex: 0 },
  //   colorField
  // ) as HTMLLabelElement
  // label.style.backgroundColor = value
  if (onchange) colorField.addEventListener('change', onchange);
  // colorField.addEventListener('input', () => {
  //   label.style.backgroundColor = colorField.value
  // })
  // return label
  return colorField;
};

export const createLineStyleField = (
  value: string,
  className: string | null = null,
  onchange: (value: string) => void
): HTMLDivElement => {
  const changeValue = (newValue: string) => {
    onchange(newValue);
    contentLine.style.strokeDasharray = DASH_ARRAY_STYLE[newValue];
    wrapper.blur();
  };
  const contentLine = h(
    'line',
    {
      x1: 8,
      y1: 16,
      x2: 112,
      y2: 16,
    },
    '',
    null,
    'http://www.w3.org/2000/svg'
  ) as SVGLineElement;
  contentLine.style.strokeDasharray = DASH_ARRAY_STYLE[value];
  const wrapper = h(
    'div',
    {
      class: 'form-line ' + (className == null ? '' : ' ' + className),
      tabindex: 0,
    },
    [
      h(
        'svg',
        { class: 'form-line-content' },
        contentLine,
        null,
        'http://www.w3.org/2000/svg'
      ),
      h('div', { class: 'form-line-selector ' + className }, [
        h(
          'svg',
          { class: 'form-line-item' },
          h(
            'line',
            {
              x1: 8,
              y1: 16,
              x2: 112,
              y2: 16,
              'stroke-dasharray': DASH_ARRAY_STYLE.Jissen,
            },
            '',
            null,
            'http://www.w3.org/2000/svg'
          ),
          () => changeValue('Jissen'),
          'http://www.w3.org/2000/svg'
        ),
        h(
          'svg',
          { class: 'form-line-item' },
          h(
            'line',
            {
              x1: 8,
              y1: 16,
              x2: 112,
              y2: 16,
              'stroke-dasharray': DASH_ARRAY_STYLE.Hasen,
            },
            '',
            null,
            'http://www.w3.org/2000/svg'
          ),
          () => changeValue('Hasen'),
          'http://www.w3.org/2000/svg'
        ),
        h(
          'svg',
          { class: 'form-line-item' },
          h(
            'line',
            {
              x1: 8,
              y1: 16,
              x2: 112,
              y2: 16,
              'stroke-dasharray': DASH_ARRAY_STYLE.Tensen,
            },
            '',
            null,
            'http://www.w3.org/2000/svg'
          ),
          () => changeValue('Tensen'),
          'http://www.w3.org/2000/svg'
        ),
        h(
          'svg',
          { class: 'form-line-item' },
          h(
            'line',
            {
              x1: 8,
              y1: 16,
              x2: 112,
              y2: 16,
              'stroke-dasharray': DASH_ARRAY_STYLE.Ittensasen,
            },
            '',
            null,
            'http://www.w3.org/2000/svg'
          ),
          () => changeValue('Ittensasen'),
          'http://www.w3.org/2000/svg'
        ),
      ]),
    ]
  ) as HTMLDivElement;
  return wrapper;
};

const timeFieldInput = (field: HTMLInputElement, e: Event): void => {
  e.stopPropagation();
  // 空白を無視したキャレット位置
  let value = field.value;
  let selectionEnd = field.selectionEnd || 0;
  selectionEnd = Math.max(
    selectionEnd -
      (value.slice(0, selectionEnd).match(/ /g) || { length: 0 }).length,
    0
  );
  // 空白を削除 -> 空白前の文字を削除
  const m1 = value.match(/\d{4}/);
  if (m1 !== null && m1.index) {
    value = value.slice(0, m1.index + 1) + value.slice(m1.index + 2);
    selectionEnd--;
  }
  // 空白を一回消して
  value = value.replace(/ /g, '').slice(0, 6);
  // もう一度入れる
  let str = '';
  if (value.length > 4) str += value.slice(-6, -4) + ' ';
  if (value.length > 2) str += value.slice(-4, -2) + ' ';
  str += value.slice(-2);
  field.value = str;
  // キャレット位置修正
  let a = 0;
  let i = 0;
  while (a !== selectionEnd) {
    if (str[i] !== ' ') a++;
    i++;
  }
  field.selectionEnd = field.selectionStart = i;
  // validation
  field.classList[!timeStringCheck(str) ? 'add' : 'remove']('invalid');
};

const timeFieldKeydown = (field: HTMLInputElement, e: KeyboardEvent): void => {
  e.stopPropagation();
  // e.keyCode: 37← 38↑ 39→ 40↓
  const keyCode = e.keyCode;
  // キャレット移動
  switch (e.keyCode) {
    case 37:
    case 39:
      {
        const value = field.value;
        const selectionEnd = field.selectionEnd;
        if (selectionEnd === null) return;
        const d = keyCode === 37 ? -1 : 1;
        if (!value[selectionEnd - 1 + d] || value[selectionEnd - 1 + d] !== ' ')
          break;
        field.selectionStart = field.selectionEnd =
          selectionEnd + (keyCode === 37 ? -1 : 1);
      }
      break;
    case 38:
    case 40:
      {
        let d = 60;
        if (e.shiftKey) d = 3600;
        if (e.altKey) d = 5;
        if (e.keyCode == 40) d *= -1;
        // 時刻 -1分, -5秒
        e.preventDefault();
        field.value = numberToTimeString(
          (timeStringToNumber(field.value) + d + 86400) % 86400,
          'HH MM SS'
        );
      }
      break;
    case 13:
      field.blur();
      break;
    default:
      return;
  }
};

const timeFieldBlur = (field: HTMLInputElement): void => {
  const value = field.value;
  if (timeStringCheck(value) && value.length < 7) {
    field.value += ' 00';
  }
};

export const DASH_ARRAY_STYLE = {
  Jissen: '',
  Hasen: '8 2',
  Tensen: '2 2',
  Ittensasen: '8 2 2 2',
};

export const timeStringCheck = (string: string): boolean => {
  string = string.replace(/ /g, '');
  if (!/^\d{3,6}$/.test(string)) {
    return false;
  }
  let h: number;
  let m: number;
  let s: number;
  if (string.length <= 4) {
    h = Number(string.slice(0, -2));
    m = Number(string.slice(-2));
    s = 0;
  } else {
    h = Number(string.slice(0, -4));
    m = Number(string.slice(-4, -2));
    s = Number(string.slice(-2));
  }
  if (h < 0 || 24 < h || m < 0 || 59 < m || s < 0 || 59 < s) return false;
  return true;
};

/**
 * 文字列形式の時刻を秒を表す数字に変換
 * @param string HHMM, HHMMSSの形式。3~6文字。
 */
export const timeStringToNumber = (oudstr: string): number => {
  if (!timeStringCheck(oudstr)) {
    return -1;
  }
  oudstr = oudstr.replace(/ /g, '');
  if (oudstr.length <= 4) {
    return Number(oudstr.slice(0, -2)) * 3600 + Number(oudstr.slice(-2)) * 60;
  } else {
    return (
      Number(oudstr.slice(0, -4)) * 3600 +
      Number(oudstr.slice(-4, -2)) * 60 +
      Number(oudstr.slice(-2))
    );
  }
};

/**
 * 文字列形式の時刻を秒を表す数字に変換
 * @param string HHMM, HHMMSSの形式。3~6文字。
 */
export type timeFormat =
  | 'HMM_space'
  | 'HMM'
  | 'min_HH:MM'
  | 'H:MM'
  | 'HH MM SS'
  | 'HMMSS';

export const numberToTimeString = (
  number: number,
  format: timeFormat
): string => {
  if (format === 'HMM_space') {
    let hour = String(Math.floor(number / 3600));
    if (hour.length === 1) hour = '\u2007' + hour;
    return hour + String(Math.floor((number % 3600) / 60)).padStart(2, '0');
  }
  if (format === 'HMM') {
    return (
      Math.floor(number / 3600) +
      String(Math.floor((number % 3600) / 60)).padStart(2, '0')
    );
  }
  if (format === 'min_HH:MM') {
    return (
      Math.floor((number % 3600) / 60) +
      ':' +
      String(Math.floor((number % 3600) % 60)).padStart(2, '0')
    );
  }
  if (format === 'H:MM') {
    return (
      Math.floor((number % 86400) / 3600) +
      ':' +
      String(Math.floor(((number % 86400) % 3600) / 60)).padStart(2, '0')
    );
  }
  if (format === 'HH MM SS') {
    return (
      String(Math.floor(number / 3600)).padStart(2, '0') +
      ' ' +
      String(Math.floor((number % 3600) / 60)).padStart(2, '0') +
      ' ' +
      String(number % 60).padStart(2, '0')
    );
  }
  if (format === 'HMMSS') {
    return (
      Math.floor(number / 3600) +
      String(Math.floor((number % 3600) / 60)).padStart(2, '0') +
      String(number % 60).padStart(2, '0')
    );
  }
  return '';
};

// 点と線分の距離の2乗
export const getDistance2 = ({ x, y, x1, y1, x2, y2 }) => {
  const r = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  const t = -(x2 - x1) * (x1 - x) - (y2 - y1) * (y1 - y);
  if (t < 0) return (x1 - x) ** 2 + (y1 - y) ** 2;
  if (t > r) return (x2 - x) ** 2 + (y2 - y) ** 2;
  return ((x2 - x1) * (y1 - y) - (y2 - y1) * (x1 - x)) ** 2 / r;
};

export class Color {
  private r: number;
  private g: number;
  private b: number;
  constructor(r: number, g: number, b: number) {
    this.r = r;
    this.g = g;
    this.b = b;
  }
  public static from(str: string): Color {
    let r = 0;
    let g = 0;
    let b = 0;
    if (/^[0-9a-fA-F]{8}$/.test(str)) {
      // 00bbggrr (oudia)
      b = parseInt(str.slice(2, 4), 16);
      g = parseInt(str.slice(4, 6), 16);
      r = parseInt(str.slice(6, 8), 16);
    } else if (/^#[0-9a-fA-F]{6}$/.test(str)) {
      // #rrggbb
      r = parseInt(str.slice(1, 3), 16);
      g = parseInt(str.slice(3, 5), 16);
      b = parseInt(str.slice(5, 7), 16);
    } else if (/^#[0-9a-fA-F]{3}$/.test(str)) {
      // #rgb
      r = parseInt(str[1], 16);
      g = parseInt(str[2], 16);
      b = parseInt(str[3], 16);
    }
    return new this(r, g, b);
  }
  public toHEXString() {
    return (
      '#' +
      this.r.toString(16).padStart(2, '0') +
      this.g.toString(16).padStart(2, '0') +
      this.b.toString(16).padStart(2, '0')
    );
  }
  public toOudiaString() {
    return (
      '00' +
      this.b.toString(16).padStart(2, '0') +
      this.g.toString(16).padStart(2, '0') +
      this.r.toString(16).padStart(2, '0')
    ).toUpperCase();
  }
  public clone() {
    return new Color(this.r, this.g, this.b);
  }
}

export class Font {
  public height: number;
  public family: string;
  public bold: boolean;
  public italic: boolean;
  constructor() {
    this.height = 9;
    this.family = 'MS ゴシック';
    this.bold = false;
    this.italic = false;
  }
  public static from(oudstr: string): Font {
    const result = new this();
    const props = oudstr.split(';');
    for (const prop of props) {
      const [key, val] = prop.split('=');
      switch (key) {
        case 'PointTextHeight':
          result.height = Number(val);
          break;
        case 'Facename':
          result.family = val;
          break;
        case 'Bold':
          result.bold = val === '1';
          break;
        case 'Italic':
          result.italic = val === '1';
          break;
      }
    }
    return result;
  }
  public toOudiaString(): string {
    return (
      'PointTextHeight=' +
      this.height +
      ';Facename=' +
      this.family +
      (this.bold ? ';Bold=1' : '') +
      (this.italic ? ';Italic=1' : '')
    );
  }
  public clone(): Font {
    return Object.assign(new Font(), this);
  }
}

/**
 * Dialogを表示します
 */
export class Dialog {
  public title: string;
  public message: string;
  public buttons: string[];
  public defaultId: number;
  public cancelId: number;
  private element: Element;
  constructor({
    title = '',
    message = '',
    buttons = ['OK'],
    defaultId = 0,
    cancelId = 0,
  } = {}) {
    Object.assign(this, { title, message, buttons, defaultId, cancelId });
  }
  /**
   * 選択されたボタンのindexを返す
   */
  public show(): Promise<number> {
    return new Promise((resolve) => {
      this.element = h(
        'div',
        { class: 'dialog-wrapper show' },
        h('div', { class: 'dialog' }, [
          h('div', { class: 'dialog-title' }, this.title),
          h('div', { class: 'dialog-body' }, this.message),
          h(
            'div',
            { class: 'dialog-buttons' },
            this.buttons.map((label, id) =>
              createButton(
                label,
                this.defaultId === id
                  ? 'dialog-button form-button-fill'
                  : 'dialog-button',
                () => {
                  this.hide();
                  resolve(id);
                }
              )
            )
          ),
        ])
      );
      document.body.appendChild(this.element);
    });
  }
  public hide() {
    this.element.classList.remove('show');
    setTimeout(() => document.body.removeChild(this.element), 2000);
  }
}

export function getDevice():
  | 'macOS'
  | 'Windows'
  | 'Linux'
  | 'iPhone'
  | 'Android Mobile'
  | 'iPad'
  | 'Android'
  | 'Other' {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS X'))
    return 'ontouchend' in document ? 'iPad' : 'macOS'; // iPadOS対応
  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('iPad')) return 'iPad';
  if (ua.includes('Android'))
    return ua.includes('Mobile') ? 'Android Mobile' : 'Android';
  if (ua.includes('Linux')) return 'Linux';
  return 'Other'; // iPod, kindle, wii, ps4, 3ds, xbox...
}
function checkAppleDevice() {
  const device = getDevice();
  return device === 'macOS' || device === 'iPad' || device === 'iPhone';
}
export class Menu {
  private element?: HTMLElement | null;
  private child: Menu | null;
  private closed: boolean;
  public items: MenuItem[];
  constructor(items: MenuItem[]) {
    this.child = null;
    this.closed = false;
    this.element = null;
    this.items = items;
  }
  /**
   * 右クリックメニューまたは、メニューバーメニューを表示
   * @param x 左上x座標
   * @param y 左上y座標
   */
  public popup({ x, y }: { x: number; y: number }) {
    this.element = h(
      'div',
      { class: 'menu-container' },
      this.build()
    ) as HTMLDivElement;
    this.element.style.left = x + 'px';
    this.element.style.top = y + 'px';
    document.body.appendChild(this.element);
    const clickListener = () => {
      document.body.removeEventListener('click', clickListener, {
        capture: true,
      });
      document.body.removeEventListener('contextmenu', clickListener, {
        capture: true,
      });
      this.closePopup();
    };
    document.body.addEventListener('click', clickListener, { capture: true });
    document.body.addEventListener('contextmenu', clickListener, {
      capture: true,
    });
  }

  private popupSubmenu(item: MenuItem[], element: HTMLElement) {
    this.closeChild();
    const { top, left } = element.getBoundingClientRect();
    this.child = new Menu(item);
    this.child.popup({ x: left, y: top });
  }
  /**
   * メニューのDOM生成
   */
  private build(): Element[] {
    return this.items.map((item: MenuItem) => {
      let result: Element;
      const content = [h('div', { class: 'menu-item-label' }, item.label)];
      if (item.hasOwnProperty('accelerator')) {
        content.push(
          h(
            'div',
            { class: 'menu-item-key' },
            Menu.getShortcutString(item.accelerator)
          )
        );
      }
      if (!('type' in item) || item.type === 'normal') {
        result = h('div', { class: 'menu-item' }, content, item.click);
        result.addEventListener(
          'mouseenter',
          this.closeChild.bind(this),
          false
        );
      } else if (item.type === 'submenu') {
        result = h(
          'div',
          { class: 'menu-item menu-item-submenu' },
          item.label,
          item.click
        );
        result.addEventListener(
          'mouseenter',
          this.popupSubmenu.bind(this, item.submenu, result),
          false
        );
      } else if (item.type === 'separator') {
        result = h('div', { class: 'menu-item menu-item-separator' });
      } else {
        result = h('div', { class: 'menu-item' });
      }
      return result;
    });
  }

  private closeChild() {
    if (this.child !== null) {
      this.child.closePopup();
      this.child = null;
    }
  }

  public closePopup() {
    this.closeChild();
    if (this.closed || !this.element) return;
    this.element.classList.add('closed');
    setTimeout(() => {
      document.body.removeChild(this.element!);
      this.closed = true;
      delete this.element;
    }, 1000);
  }

  // Menu内から該当するショートカットキーに対応するMenuItemのclick(=function)をさがす
  public static findByShortcut(
    items: MenuItem[],
    event: KeyboardEvent
  ): (() => void) | null {
    const keySet = this.getKeyName(event);
    return this.searchShortcuts(items, keySet);
  }

  // findByShortcutの本体。再帰
  private static searchShortcuts(
    menu: MenuItem[],
    keySet: Set<string>
  ): (() => void) | null {
    const isApple = checkAppleDevice();
    loop1: for (const item of menu) {
      // submenuまでたどる(再帰)
      if (item.submenu) {
        const result = this.searchShortcuts(item.submenu, keySet);
        if (result !== null) return result;
      }
      if (!item.accelerator || !item.click) continue;
      const keys = item.accelerator.split('+');
      if (keys.length !== keySet.size) continue;
      for (const key of keys) {
        // https://electronjs.org/docs/api/accelerator
        const keyName = key
          .replace(
            /CmdOrCtrl|CommandOrControl/,
            isApple ? 'Command' : 'Control'
          )
          .replace('Cmd', 'Command')
          .replace('Ctrl', 'Control')
          .replace('Option', 'Alt')
          .replace('Return', 'Enter')
          .replace('Esc', 'Escape');
        if (!keySet.has(keyName)) continue loop1;
      }
      return item.click;
    }
    return null;
  }

  // キーボードで押しているキーの名前のSetを生成する。
  private static getKeyName(e: KeyboardEvent): Set<string> {
    const isApple = checkAppleDevice();
    const result: Set<string> = new Set();
    if (e.metaKey) result.add(isApple ? 'Command' : 'Windows');
    if (e.ctrlKey) result.add('Control');
    if (e.altKey) result.add('Alt');
    if (e.shiftKey) result.add('Shift');
    result.add(
      e.code
        .replace(/^(Contol|Shift|Meta|Alt|OS)(Left|Right)$/, '$1')
        .replace('Meta', isApple ? 'Command' : 'Windows')
        .replace(/^Digit([0-9])$/, '$1')
        .replace(/^Key([A-Z])$/, '$1')
        .replace(/^Arrow(Up|Down|Left|Right)$/, '$1')
    );
    return result;
  }

  // 表示用のキーの名前を生成する
  public static getShortcutString(accelerator?: string) {
    if (!accelerator) return '';
    const isApple = checkAppleDevice();
    let result = '';
    const keys = accelerator.split('+');
    if (isApple) {
      const symbolMap = {
        Ctrl: '↩',
        Control: '↩',
        Alt: '⌥',
        Option: '⌥',
        Shift: '⇧',
        CmdOrCtrl: '⌘',
        Comannd: '⌘',
        Cmd: '⌘',
        Enter: '↩',
        Return: '↩',
        Esc: '⎋',
        Escape: '⎋',
        Tab: '⇥',
        Space: 'スペース',
        Delete: '⌫',
        Backspace: '⌫',
        'Caps Lock': '⇪',
        Up: '↑',
        Down: '↓',
        Left: '←',
        Right: '→',
      };
      for (const key in symbolMap) {
        if (symbolMap.hasOwnProperty(key)) {
          const index = keys.indexOf(key);
          if (index === -1) continue;
          result += symbolMap[key];
          keys.splice(index, 1);
        }
      }
      result += keys.join('');
    } else {
      result = accelerator
        .replace(/CmdOrCtrl|Control|CommandOrControl/, 'Ctrl')
        .replace('Escape', 'Esc')
        .replace('-', "'-'");
    }
    return result;
  }
}
