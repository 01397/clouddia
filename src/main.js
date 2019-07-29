"use strict";

import App from "./App.js";
let app = null;

document.addEventListener('DOMContentLoaded', () => {
    window.app = app = new App(document.getElementById('app'));
    const url = location.search.match(/url=([^&]+)/);
    let type = location.search.match(/type=([^&]+)/);
    type = type === null ? 'oud' : type[1];
    if (url){
        switch(type) {
            case 'oud': app.loadOudFileOnline(url[1]);
        }
    } else {
        app.showWelcomeView();
    }
    window.addEventListener('resize', (e) => {
        e.preventDefault();
    });

    // お遊び
    console.log('%c %cWelcome To\n%c %cCloud %cDia', 'padding:0px 32px;background-image:url(http://onemu.starfree.jp/clouddia/img/logo_icon_dark.svg);background-size:cover;background-position:0 -10px;', 'font-size:14px;font-style:italic;', 'padding:16px 32px;background-image:url(http://onemu.starfree.jp/clouddia/img/logo_icon_dark.svg);background-size:cover;background-position:0 -24px;','padding:4px 0 4px 8px;color: #888888;font-size:24px;background-color:#1f1a24;background-image:linear-gradient(to right, #52a8ff00, #52a8ffaa );background-size: 100% 2px;background-position:0 calc(100% - 4px); background-repeat: no-repeat;border-radius:4px 0 0 4px', 'padding:4px 8px 4px 0;color:#a852ff;font-size:24px;background-color:#1f1a24;background-image:linear-gradient(to right, #52a8ffaa, #52a8ff 90%);background-size: 100% 2px;background-position:0 calc(100% - 4px); background-repeat: no-repeat;border-radius:0 4px 4px 0');
});

