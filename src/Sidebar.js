'use strict';

import { h } from "./Util.js";

// 画面左側の表示
export default class Sidebar {
  constructor(app) {
    this.app = app;
    this.render();
  }
  // サイドバーの更新処理。命名が下手。
  render() {
    const data = this.app.data;
    const fileLoaded = data !== null;
    let elements = [
      h('div', { class: 'sidebar-section', id: 'sidebar-logo' }, null, () => this.app.showWelcomeView()),
      h('div', { class: 'sidebar-section', id: 'sidebar-railwayName' }, fileLoaded ? data.Rosen[0].Rosenmei : 'Welcome!!')
    ];
    if (fileLoaded) {
      elements.push(
        h('div', { class: 'sidebar-section' }, [
          h('div', { class: 'sidebar-section-title' }, '路線'),
          h('div', { class: 'sidebar-section-content' }, '駅', () => this.app.showComingSoonView()),
          h('div', { class: 'sidebar-section-content' }, '種別', () => this.app.showComingSoonView()),
        ])
      );
      data.Rosen[0].Dia.forEach((val, idx) => {
        elements.push(
          h('div', { class: 'sidebar-section' }, [
            h('div', { class: 'sidebar-section-title' }, val.DiaName),
            h('div', { class: 'sidebar-section-content' + (idx==0 ? ' selected' : '') }, '下り列車時刻表', () => this.app.showTrainTimetableView(idx, 'Kudari')),
            h('div', { class: 'sidebar-section-content' }, '上り列車時刻表', () => this.app.showTrainTimetableView(idx, 'Nobori')),
            h('div', { class: 'sidebar-section-content' }, '駅時刻表', () => this.app.showStationTimetableView(idx)),
            h('div', { class: 'sidebar-section-content' }, 'ダイヤグラム', () => this.app.showDiagramView(idx))
          ])
        );
      });
      document.title = data.Rosen[0].Rosenmei + ' - CloudDia';
    }
    const sidebar = h('div', {id: 'sidebar'}, elements);
    sidebar.addEventListener('click', e => {
      sidebar.querySelector('.selected').classList.remove('selected');
      e.target.classList.add('selected');
    });
    document.getElementById('sidebar').replaceWith(sidebar);
  }
  show() {
    this.app.wrapper.classList.add('sidebar-on');
  }
  hide() {
    this.app.wrapper.classList.remove('sidebar-on');
  }
}