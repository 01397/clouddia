'use strict';

import { h } from "./Util.js";

// 画面左側の表示
export default class Sidebar {
  constructor(app) {
      this.app = app;
  }
  // サイドバーの更新処理。命名が下手。
  render() {
      let elements = [];
      elements.push(
          h('div', { class: 'sidebar-section' }, [
              h('div', { class: 'sidebar-section-title' }, '路線'),
              h('div', { class: 'sidebar-section-content' }, '駅', () => this.app.showComingSoonView()),
              h('div', { class: 'sidebar-section-content' }, '種別', () => this.app.showComingSoonView()),
          ])
      );
      const data = this.app.data;
      data.Rosen[0].Dia.forEach((val, idx) => {
          elements.push(
              h('div', { class: 'sidebar-section' }, [
                  h('div', { class: 'sidebar-section-title' }, val.DiaName),
                  h('div', { class: 'sidebar-section-content' }, '下り列車時刻表', () => this.app.showTrainTimetable(idx, 'Kudari')),
                  h('div', { class: 'sidebar-section-content' }, '上り列車時刻表', () => this.app.showTrainTimetable(idx, 'Nobori')),
                  h('div', { class: 'sidebar-section-content' }, '駅時刻表', () => this.app.showComingSoonView()),
                  h('div', { class: 'sidebar-section-content' }, 'ダイヤグラム', () => this.app.showDiagramView(idx))
              ])
          );
      });
      document.getElementById('sidebar-menu-wrapper').append(...elements);
      const title = data.Rosen[0].Rosenmei;
      document.getElementById('sidebar-railwayName').textContent = title;
      document.title = title + ' - CloudDia';
  }
}