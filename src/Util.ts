// DOM生成。
export const h = (
  tag: string,
  attr: {} = null,
  body: string | number | Node | Node[] = null,
  onclick: (e: Event) => void = null,
  ns: string = null
): Element => {
  const element =
    ns === null
      ? document.createElement(tag)
      : document.createElementNS(ns, tag);
  if (attr != null) {
    for (const key in attr) {
      if (attr.hasOwnProperty(key)) {
        element.setAttribute(key, attr[key]);
      }
    }
  }
  if (onclick != null) {
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
  className?: string,
  onchange: (e?: Event) => any = null
): HTMLInputElement => {
  const field = h('input', {
    class: 'form-time ' + className,
    value,
    type: 'text',
  }) as HTMLInputElement;
  field.addEventListener('input', e => fieldInput(field, e));
  field.addEventListener('keydown', e => fieldKeydown(field, e));
  field.addEventListener('blur', e => {
    fieldBlur(field, e);
    onchange(e);
  });
  if (onchange !== null) field.addEventListener('change', onchange);
  return field;
};
export const createTextField = (
  value: string,
  placeholder = '',
  className?: string,
  onchange: (e?: Event) => any = null,
  oninput: (e?: Event) => any = null
): HTMLInputElement => {
  const field = h('input', {
    class: 'form-text ' + className,
    value,
    type: 'text',
    placeholder,
  }) as HTMLInputElement;
  field.addEventListener('focus', () => field.focus());
  if (onchange !== null) field.addEventListener('change', onchange);
  if (oninput !== null) field.addEventListener('input', oninput);
  return field;
};
export const createMultilineTextField = (
  value: string,
  placeholder = '',
  className?: string,
  onchange: (e?: Event) => any = null
): HTMLTextAreaElement => {
  const field = h(
    'textarea',
    { class: 'form-text-multiline fs-flex', placeholder },
    value
  ) as HTMLTextAreaElement;
  if (onchange !== null) field.addEventListener('change', onchange);
  return field;
};
export const createCheckbox = (
  checked: boolean,
  className?: string,
  onchange: (e?: Event) => any = null
): HTMLInputElement => {
  const checkbox = h('input', {
    class: 'form-checkbox ' + className,
    type: 'checkbox',
  }) as HTMLInputElement;
  checkbox.checked = checked;
  if (onchange !== null) checkbox.addEventListener('change', onchange);
  return checkbox;
};
export const createRadio = (
  checked: boolean,
  name?: string,
  className?: string,
  onchange: (e?: Event) => any = null
): HTMLInputElement => {
  const radio = h('input', {
    class: 'form-radio ' + className,
    type: 'radio',
    name,
  }) as HTMLInputElement;
  radio.checked = checked;
  if (onchange !== null) radio.addEventListener('change', onchange);
  return radio;
};
export const createButton = (
  value: string,
  className?: string,
  onclick: (e?: Event) => any = null
): HTMLInputElement => {
  return h(
    'input',
    { class: 'form-button ' + className, type: 'button', value },
    null,
    onclick
  ) as HTMLInputElement;
};
export const createColorField = (
  value: string,
  className?: string,
  onchange: (e?: Event) => any = null
): HTMLLabelElement => {
  const colorField = h('input', { type: 'color', value }) as HTMLInputElement;
  const label = h(
    'label',
    { class: 'form-color ' + className, tabindex: 0 },
    colorField
  ) as HTMLLabelElement;
  label.style.backgroundColor = value;
  colorField.addEventListener('change', onchange);
  colorField.addEventListener('input', () => {
    label.style.backgroundColor = colorField.value;
  });
  return label;
};
export const createLineStyleField = (
  value: string,
  className?: string,
  onchange: (value: string) => any = null
): HTMLDivElement => {
  const changeValue = newValue => {
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
      'stroke-dasharray': DASH_ARRAY_STYLE[value],
    },
    '',
    null,
    'http://www.w3.org/2000/svg'
  ) as SVGLineElement;
  const wrapper = h('div', { class: 'form-line ' + className, tabindex: 0 }, [
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
  ]) as HTMLDivElement;
  return wrapper;
};
const fieldInput = (field: HTMLInputElement, e: Event): void => {
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
  if (m1 !== null) {
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
const fieldKeydown = (field: HTMLInputElement, e: KeyboardEvent): void => {
  // e.keyCode: 37← 38↑ 39→ 40↓
  const keyCode = e.keyCode;
  // キャレット移動
  if (keyCode === 37 || keyCode === 39) {
    const value = field.value;
    const selectionEnd = field.selectionEnd;
    const d = keyCode === 37 ? -1 : 1;
    if (!value[selectionEnd - 1 + d] || value[selectionEnd - 1 + d] !== ' ')
      return;
    field.selectionStart = field.selectionEnd =
      selectionEnd + (keyCode === 37 ? -1 : 1);
  } else if (keyCode === 38) {
    // 時刻 +1分, +5秒
    e.preventDefault();
    field.value = numberToTimeString(
      (timeStringToNumber(field.value) + (e.shiftKey ? 5 : 60) + 86400) % 86400,
      'HH MM SS'
    );
  } else if (keyCode === 40) {
    // 時刻 -1分, -5秒
    e.preventDefault();
    field.value = numberToTimeString(
      (timeStringToNumber(field.value) - (e.shiftKey ? 5 : 60) + 86400) % 86400,
      'HH MM SS'
    );
  }
};
const fieldBlur = (field: HTMLInputElement, e: FocusEvent): void => {
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
    return;
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
  private r: number;
  private g: number;
  private b: number;
  constructor(r: number, g: number, b: number) {
    this.r = r;
    this.g = g;
    this.b = b;
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
}
