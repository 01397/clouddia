<?php
header("Content-type: text/plain; charset=Shift_JIS");
header("Access-Control-Allow-Origin: *");
//header("Access-Control-Allow-Origin: http://onemu.starfree.jp");
if(strpos($_SERVER['HTTP_HOST'], 'soasa.starfree.jp') !== false && isset($_GET['url']) && preg_match('/^http(s)?:(?!.*soasa\.starfree\.jp)/', $_GET['url'])){
    echo file_get_contents(preg_replace('/\r\n|\r|\n/', '\n', $_GET['url']));
} else {
    echo '(�L�E�́E�M)';
}
?>