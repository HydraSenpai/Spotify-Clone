let redirect_uri = "http://127.0.0.1:5500/spotify.html";

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
const RECENT = "https://api.spotify.com/v1/me/player/recently-played";
const FEATURED = "https://api.spotify.com/v1/browse/featured-playlists";

function onPageLoad(){
    clientId = localStorage.getItem("client_id");
    clientSecret = localStorage.getItem("client_secret");
    if ( window.location.search.length > 0 ){
        handleRedirect();
    } else{
        access_token = localStorage.getItem("access_token");
        if ( access_token == null ){
            // we don't have an access token so present token section
            document.getElementById("login__section").style.display = 'block';  
            document.getElementById("main__section").style.display = 'none';
        } else {
            // we have an access token so present device section
            document.getElementById("main__section").style.display = 'block';
            document.getElementById("login__section").style.display = 'none'; 
            displayPlaylists();
        }
    }
}
function handleRedirect(){
    let code = getCode();
    fetchAccessToken( code );
    window.history.pushState("", "", redirect_uri); // remove param from url
}

function getCode(){
    let code = null;
    const queryString = window.location.search;
    if ( queryString.length > 0 ){
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code')
    }
    return code;
}

function requestAuthorization(){
    clientId = document.getElementById("clientId").value;
    clientSecret = document.getElementById("clientSecret").value;
    localStorage.setItem("client_id", clientId);
    localStorage.setItem("client_secret", clientSecret); // In a real app you should not expose your client_secret to the user

    let url = AUTHORIZE;
    url += "?client_id=" + clientId;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";
    window.location.href = url; // Show Spotify's authorization screen
}

function fetchAccessToken( code ){
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
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(clientId + ":" + clientSecret));
    xhr.send(body);
    xhr.onload = handleAuthorizationResponse;
}

function handleAuthorizationResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        var data = JSON.parse(this.responseText);
        if ( data.access_token != undefined ){
            access_token = data.access_token;
            localStorage.setItem("access_token", access_token);
        }
        if ( data.refresh_token  != undefined ){
            refresh_token = data.refresh_token;
            localStorage.setItem("refresh_token", refresh_token);
        }
        onPageLoad();
    }
    else {
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

function handlePlaylistsResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        const playlists = document.getElementById("playlistList");
        for(let x=0;x<data.items.length;x++){
            playlists.innerHTML += `<li> ${data.items[x].name} </li>`;
        }
        const featured = document.getElementById('mainFeatured');

        //need to fix random to not have duplicates
        let random = 0;
        let usedPlaylists = []
        //should only generate 6 but needs input validation incase user has < 6 playlists available
        let loopTime = 5;
        if(data.items.length < 5){
            loopTime = data.items.length;
        }
        //Goes through 6 times to generate all recommedations on the main header
        for(let y=0;y<loopTime;y++){
            //will use random playlists to fill recommendations
            random = Math.floor(Math.random()*data.items.length);
            //will search through array of playlists already displayed and ignore already used ones to stop duplicates
            while(usedPlaylists.includes(random)){
                random = Math.floor(Math.random()*data.items.length);
            }
            //adds to used array
            usedPlaylists[y] = random;
            featured.innerHTML += `<div class="main__top-item">
                                        <img src="${data.items[random].images[0].url}" class="main__top-image">
                                        <div class="main__top-text">${data.items[random].name}</div>
                                </div>`;
        }
    } else if ( this.status == 401 ){
        refreshAccessToken();
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function displayPlaylists(){
    callApi("GET", PLAYLISTS, null, handlePlaylistsResponse);
}



