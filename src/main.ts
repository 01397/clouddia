import App from './App.js';
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('app')!;
  const app = new App(rootElement);
  // for debug
  // tslint:disable-next-line: no-string-literal
  window['app'] = app;

  // urlから
  const m1 = location.search.match(/url=([^&]+)/);
  const m2 = location.search.match(/type=([^&]+)/);
  const type = m2 === null ? 'oud' : m2[1];
  if (m1 !== null) {
    switch (type) {
      case 'oud':
        app.loadOnlineFile(m1[1]);
    }
  }

  // tslint:disable-next-line: no-console
  console.log(
    '%c %cWelcome To\n%c %cCloud %cDia',
    'padding:0px 32px;background-image:url(https://clouddia.app/img/logo_icon_dark.svg);background-size:cover;background-position:0 -10px;',
    'font-size:14px;font-style:italic;',
    'padding:16px 32px;background-image:url(https://clouddia.app/img/logo_icon_dark.svg);background-size:cover;background-position:0 -24px;',
    'padding:4px 0 4px 8px;color: #888888;font-size:24px;background-color:#1f1a24;background-image:linear-gradient(to right, #52a8ff00, #52a8ffaa );background-size: 100% 2px;background-position:0 calc(100% - 4px); background-repeat: no-repeat;border-radius:4px 0 0 4px',
    'padding:4px 8px 4px 0;color:#a852ff;font-size:24px;background-color:#1f1a24;background-image:linear-gradient(to right, #52a8ffaa, #52a8ff 90%);background-size: 100% 2px;background-position:0 calc(100% - 4px); background-repeat: no-repeat;border-radius:0 4px 4px 0'
  );
});
