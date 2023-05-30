const APP_NAME = "스스시";

//네이티브 얼랏
async function n_alert(msg){
    await window.api.alert(APP_NAME,msg);
}
//네이티브 에러
async function n_error(msg){
    await window.api.error(APP_NAME,msg);
}
//네이티브 CONFIRM
async function n_confirm(msg){
    const result = await window.api.confirm(APP_NAME,msg);
    //0 : 예
    //1 : 아니오
    return result;
}

//창사이즈 변경
async function n_resize(width,height){
    await window.api.resize(width,height);
}

//함수로 만들어놨지만 직접 API접근해서 사용해도 상관없다
async function n_setItem(key,value){
    await window.api.setItem(key,value);
}

async function n_getItem(key){
    var item = await window.api.getItem(key);
    //console.log("LOGIN ITEM RESULT",item);
    return item;
}

async function n_clearItem(){
    await window.api.clearItem();
}

async function n_getVersion(){
    return window.api.getVersion();
}


async function n_encrypt(text){
    return window.api.encrypt(text);
}

async function n_decrypt(text){
    return window.api.decrypt(text);
}
//qr_code 출력
async function n_qr_code_issue(text){
    return window.api.qr_code_issue(text);
}
//electron->브라우저열기
async function n_browser_open(text){
    await window.api.browser_open(text);
}