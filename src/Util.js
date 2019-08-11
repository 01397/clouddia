

// DOM生成。
export const h = (tag, attr = null, body = null, onclick = null, ns = null) => {
  const element = ns === null ? document.createElement(tag) : document.createElementNS(ns, tag);
  if (attr != null) {
    for (let key in attr) {
      element.setAttribute(key, attr[key]);
    }
  }
  if (onclick != null) {
    element.addEventListener('click', onclick, { passive: true, capture: false });
  }
  if (typeof body === 'string') {
    element.textContent = body;
  } else if (typeof body === 'number') {
    element.textContent = String(body);
  } else if (body instanceof Element) {
    element.appendChild(body);
  } else if (body instanceof Array) {
    element.append(...body);
  } else if (body !== null) {
    console.warn('この中身は想定してない！！\n' + body);
  }
  return element;
};


// https://qiita.com/saekis/items/c2b41cd8940923863791
export const x = string => {
  if (typeof string !== 'string') {
    return string;
  }
  return string.replace(/[&'`"<>]/g, function (match) {
    return {
      '&': '&amp;',
      "'": '&#x27;',
      '`': '&#x60;',
      '"': '&quot;',
      '<': '&lt;',
      '>': '&gt;',
    }[match];
  });
};

// 時分を表す文字列を、0:00からの経過分数に変換
// 例) '752' → 472
export const HHMMtoMinutes = HHMMstring => {
  if (HHMMstring == "") return null;
  return HHMMstring.slice(0, -2) * 60 + HHMMstring.slice(-2) * 1;
};


// 0:00からの経過分数を、時分を表す文字列に変換
// 例) 893 → '1453'
export const MinutesToHHMM = (min = null, str = "") => {
  if (min === null) return null;
  return Math.floor(min / 60) + str + String(min % 60).padStart(2, '0');
};

// Oudiaで用いられる色を、#rrggbbの形に変換
export const ouColorToHex = (ouColor) => {
  const b = ouColor.slice(2, 4);
  const g = ouColor.slice(4, 6);
  const r = ouColor.slice(6, 8);
  return '#' + r + g + b;
};

// 線分と点の距離
export const getDistance2 = ({ x, y, x1, y1, x2, y2 }) => {
  const r = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  const t = -(x2 - x1) * (x1 - x) - (y2 - y1) * (y1 - y);
  if (t < 0) return (x1 - x) ** 2 + (y1 - y) ** 2;
  if (t > r) return (x2 - x) ** 2 + (y2 - y) ** 2;
  return ((x2 - x1) * (y1 - y) - (y2 - y1) * (x1 - x)) ** 2 / r;
}
