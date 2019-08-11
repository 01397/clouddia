'use strict';

import { h, ouColorToHex, MinutesToHHMM } from "./Util.js";

export default class InfoPanel {
  constructor(app) {
    this.app = app;
    this.render();
  }
  render() {
    const infopanel = h('div', { id: 'infoPanel' }, "hey!");
    document.getElementById('infoPanel').replaceWith(infopanel);
  }
  showString(string) {
    const infopanel = h('div', { id: 'infoPanel' }, string);
    document.getElementById('infoPanel').replaceWith(infopanel);
  }
  /*
    trainData = {diaIndex, index, direction}
  */
  showTrain(trainData) {
    const train = this.app.data.Rosen[0].Dia[trainData.diaIndex][trainData.direction === 'inbound' ? 'Nobori' : 'Kudari'][0].Ressya[trainData.index];
    const station = this.app.data.Rosen[0].Eki;
    const content = train.timetable.map((data, i) => {
      const arrival = data !== null ? MinutesToHHMM(data.arrival) : null;
      const departure = data !== null ? MinutesToHHMM(data.departure) : null;
      const className = (data !== null && data.stopType === 3) ? 'info-train-timetable-time disabled' : 'info-train-timetable-time';
      return h('div', {class: 'info-train-timetable-item'}, [
        h('div', {class: 'info-train-timetable-title'}, station[trainData.direction === 'inbound' ? station.length - 1- i : i].Ekimei),
        h('div', {class: className}, arrival),
        h('div', {class: className}, departure)
      ]);
    });
    const infopanel = h('div', { id: 'infoPanel' }, [
      h('div', {style: 'text-align:right'}, 'CLOSE', () => this.app.isActiveInfoPanel = false),
      h('div', null, [
        h(
          'span',
          { class: 'info-train-type', style: 'background-color: ' + ouColorToHex(this.app.data.Rosen[0].Ressyasyubetsu[train.Syubetsu].JikokuhyouMojiColor) },
          this.app.data.Rosen[0].Ressyasyubetsu[train.Syubetsu].Syubetsumei
        ), h(
          'span',
          { class: 'info-train-terminal' },
          this.app.data.Rosen[0].Eki[train.terminalIndex].Ekimei
        )
      ]),
      h('div', null, '列車番号: ' + train.Ressyabangou),
      h('div', null, '列車名: ' + train.Ressyamei),
      h('div', {class: 'info-train-timetable'}, content)
    ]);
    document.getElementById('infoPanel').replaceWith(infopanel);
    this.app.isActiveInfoPanel = true;
  }
}