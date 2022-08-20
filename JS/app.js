let redirect_uri = "";

let clientId = "";
let clientSecret = "";

let access_token = null;
let refresh_token = null;

const AUTHORIZE = "https://accounts.spotify.com/authorize";
const TOKEN = 'https://accounts.spotify.com/api/token';

function onPageLoad(){
    clientId = localStorage.getItem("clientId");
    clientSecret = localStorage.getItem("clientSecret");

    if(window.location.search.length > 0){
        handleRedirect();
    }
}

function handleRedirect(){
    let code = getCode();
    fetchAccessToken(code);
    window.history.pushState("","", redirect_uri);
}

function getCode(){
    let code = null;
    const query = window.location.search;
    if(query.length>0){
        const urlParams = new URLSearchParams(query);
        code = urlParams.get('code');
    }
    return code;
}

function fetchAccessToken(code){
    let body = "grant_type=authorization_code";
    body += "&code=" + code;
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + clientId;
    body += "&client_secret=" + clientSecret;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body){
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(clientId + ':' + clientSecret));
    xhr.send(body);
    xhr.onload = requestAuthorizationResponse;
}

function requestAuthorizationResponse(){
    if(this.status === 200){
        var data = JSON.parse(this.responseText);
        console.log(data);
        if(data.access_token != undefined){
            access_token = data.access_token;
            localStorage.setItem("access_token", access_token);
        }
        if(data.refresh_token != undefined){
            refresh_token = data.refresh_token;
            localStorage.setItem("refresh_token", refresh_token);
        }
        onPageLoad();
    } else {
        alert(this.responseText);
    }
}


function requestAuthorization(){
    clientId = document.getElementById("clientId").value;
    clientSecret = document.getElementById("clientSecret").value;

    localStorage.setItem("clientId", clientId);
    localStorage.setItem("clientSecret", clientSecret);

    let url = AUTHORIZE;
    url += "?client_id=" + clientId;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played user-top-read user-read-currently-playing user-read-private";

    window.location.href = url;

}