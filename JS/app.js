let redirect_uri = "";

let authorized = false;

let clientId = "";
let clientSecret = "";

let access_token = null;
let refresh_token = null;

const AUTHORIZE = "https://accounts.spotify.com/authorize";
const TOKEN = 'https://accounts.spotify.com/api/token';
const DEVICES = 'https://api.spotify.com/v1/me/player/devices';
const PLAYLISTS = 'https://api.spotify.com/v1/me/playlists';
const PLAY = 'https://api.spotify.com/v1/me/player/play';
const PREV = 'https://api.spotify.com/v1/me/player/previous';
const PAUSE = 'https://api.spotify.com/v1/me/player/pause';
const NEXT = 'https://api.spotify.com/v1/me/player/next';

function onMainLoad(){
    clientId = localStorage.getItem("clientId");
    clientSecret = localStorage.getItem("clientSecret");
    console.log(authorized);
    if(authorized == true){
        redirect_uri = "";
        console.log("1");
        window.location.href = redirect_uri;
    } else if(window.location.search.length > 0){
        console.log("2");
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

function refreshAccessToken(){
    refresh_token = localStorage.getItem("refresh_token");
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + clientId;
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
    console.log(this.status);
    if(this.status === 200){
        authorized = true;
        var data = JSON.parse(this.responseText);
        if(data.access_token != undefined){
            access_token = data.access_token;
            localStorage.setItem("access_token", access_token);
        }
        if(data.refresh_token != undefined){
            refresh_token = data.refresh_token;
            localStorage.setItem("refresh_token", refresh_token);
        }
        onMainLoad();
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

function handleResponse(){
    if(this.status == 200){
        console.log(this.value);
    } else if(this.status == 401){
        refreshAccessToken();
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function callApi(method, url, body, callback){
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xhr.send(body);
    xhr.onload = callback;
}



