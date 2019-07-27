'use strict';

export default class ComingSoonView{
    constructor(){}
    render(){
        document.getElementById('mainWindow').innerHTML = `<div style="position:absolute;left:${Math.random()*100}px;top:${Math.random()*200}px">まだ作ってる途中です〜〜。</div>`;
    }
    finish(){}
}
