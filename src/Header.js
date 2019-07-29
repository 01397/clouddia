'use strict';

import { h } from "./Util.js";

export default class Header {
  constructor(app) {
    this.app = app;
    this.wrapper = document.getElementById('header');
    this.sidebarButton = h('div', {id: 'header-toggleSidebar'}, null, () => {
      this.app.sidebar.show();
    });
    this.subtitleLabel = h('div', {id: 'header-subtitle'});
    this.titleLabel = h('div', {id: 'header-title'});
    this.wrapper.append(
      this.sidebarButton,
      h('div', {id: 'header-titleContainer'}, [
        this.subtitleLabel,
        this.titleLabel
      ])
    );
  }
  set title(title) {
    this.titleLabel.textContent = title;
  }
  set subtitle(subtitle) {
    this.subtitleLabel.textContent = subtitle;
  }
  setStatus(fileLoaded) {
    this.app.wrapper.classList[fileLoaded ? 'add': 'remove']('no-file');
  }
}