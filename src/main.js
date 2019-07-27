"use strict";

import App from "./App.js";

let app = null;

document.addEventListener('DOMContentLoaded', () => {
    window.app = app = new App();
    const url = location.search.match(/(?<=url=)[^&]+/);
    let type = location.search.match(/(?<=type=)[^&]+/);
    type = type === null ? 'oud' : type[0];
    if (url){
        switch(type) {
            case 'oud': app.loadOudFileOnline(url[0]);
        }
    } else {
        app.showWelcomeView();
    }
});

