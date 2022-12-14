let redirect_uri = "http://127.0.0.1:5500/spotify.html";

//client verification variables
let clientId = "";
let clientSecret = "";
let access_token = null;
let refresh_token = null;

//boolean state variables
let currentDeviceId;
let playing = false;
let shuffled = false;
let looped = false;

//variable to reset shuffle and loop button since you cant change hover styles in js directly
let css = '#shuffleButton:hover{color:green;}';
let style = document.createElement('style');

//endpoints of the spotify api
const AUTHORIZE = "https://accounts.spotify.com/authorize";
const TOKEN = 'https://accounts.spotify.com/api/token';
const DEVICES = 'https://api.spotify.com/v1/me/player/devices';
const PLAYLISTS = 'https://api.spotify.com/v1/me/playlists';
const CURRENT = "https://api.spotify.com/v1/me/player/currently-playing";
const PLAYING = "https://api.spotify.com/v1/me/player";
const PLAY = 'https://api.spotify.com/v1/me/player/play';
const PREV = 'https://api.spotify.com/v1/me/player/previous';
const PAUSE = 'https://api.spotify.com/v1/me/player/pause';
const NEXT = 'https://api.spotify.com/v1/me/player/next';
const RECENT = "https://api.spotify.com/v1/me/player/recently-played";
const FEATURED = "https://api.spotify.com/v1/browse/featured-playlists";
const SHOWS = "https://api.spotify.com/v1/shows";
const TOP = "https://api.spotify.com/v1/me/top/artists";
const SHUFFLE = "https://api.spotify.com/v1/me/player/shuffle";
const LOOP = "https://api.spotify.com/v1/me/player/repeat";

//creating addListeners since css onclick bugs out
window.onload=function(){
    let playButton = document.getElementById("playButton");
    playButton.addEventListener("click", playPause);
    let nextButton = document.getElementById("nextButton");
    nextButton.addEventListener("click", next);
    let prevButton = document.getElementById("prevButton");
    prevButton.addEventListener("click", prev);
    let shuffleButton = document.getElementById("shuffleButton");
    shuffleButton.addEventListener("click", shuffle);
    let loopButton = document.getElementById("loopButton");
    loopButton.addEventListener("click", loop);
    onPageLoad();
  }



function onPageLoad(){
    //reloads client variables everytime to keep authentication
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
            displayWelcomeMessage();
            displayPlaylists();
            displayFeatured();
            getCurrent();
            isPause();
            getDevices();
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

function displayWelcomeMessage(){
    let hour = new Date();
    const mainWelcome = document.getElementById("mainWelcome");
    if(hour.getHours() >= 12){
        mainWelcome.innerHTML = "Good Afternoon";
    } else {
        mainWelcome.innerHTML = "Good Morning";
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
        const main = document.getElementById("mainObjects1");
        const mainTitle = document.getElementById("mainTitle1");
        mainTitle.innerHTML = "Your playlists...";
        loopTime = 8;
        if(data.items.length < 8){
            loopTime = data.items.length;
        }
        for(let x=0;x<loopTime;x++){
            main.innerHTML += `<div class="main__object">
                        <img class="main__object-image" src="${data.items[x].images[0].url}">
                        <div class="main_object-text">${data.items[x].name}</div>
                        <div class="main_object-description">${data.items[x].description}</div>
                    </div>`
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

function handleFeaturedResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        const main = document.getElementById("mainObjects");
        const mainTitle = document.getElementById("mainTitle");
        mainTitle.innerHTML = data.message;
        for(let x=0;x<8;x++){
            main.innerHTML += `<div class="main__object">
                        <img class="main__object-image" src="${data.playlists.items[x].images[0].url}">
                        <div class="main_object-text">${data.playlists.items[x].name}</div>
                        <div class="main_object-description">${data.playlists.items[x].description}</div>
                    </div>`
        }
    } else if ( this.status == 401 ){
        refreshAccessToken();
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function displayFeatured(){
    callApi("GET", FEATURED, null, handleFeaturedResponse);
}

function handleCurrentResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        const image = document.getElementById("footerImage");
        image.src = data.item.album.images[0].url;
        const name = document.getElementById("footerName");
        name.innerHTML = data.item.name;

        
        const artist = document.getElementById("footerArtist");
        artist.innerHTML = `<div class="footer__song-artists">${data.item.artists[0].name}</div>`
        for(let x=1;x<data.item.artists.length;x++){
            artist.innerHTML += ", " + `<div class="footer__song-artists">${data.item.artists[x].name}</div>`;
        }

    } else if ( this.status == 401 ){
        refreshAccessToken();
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function getCurrent(){
    callApi("GET", CURRENT, null, handleCurrentResponse);
}

function handlePlayResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        if(data.is_playing){
            playing = true;
            //set bar
        } else {
            const play = document.getElementById("playButton");
            play.innerHTML = `<a class="footer__play-button" id="playButton">
                            <i  style="font-size:2rem;padding-bottom:0px;color:white;" class="fa-solid fa-circle-play"></i>
                        </a>`;
            playing = false;
        }
    } else if ( this.status == 401 ){
        refreshAccessToken();
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function isPause(){
    callApi("GET", PLAYING, null, handlePlayResponse);
}

function handleDeviceResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        currentDeviceId = data.devices[0].id;
    } else if ( this.status == 401 ){
        refreshAccessToken();
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function getDevices(){
    try {
        callApi("GET", DEVICES, null, handleDeviceResponse);
    } catch(err){
        console.log("Error with selected device");
    }
    
}

function handlePauseResponse(){
    console.log("pause status = " + this.status);
    if (this.status == 204){
        const play = document.getElementById("playButton");
        play.innerHTML = `<a class="footer__play-button" id="playButton">
                            <i  style="font-size:2rem;padding-bottom:0px;color:white;" class="fa-solid fa-circle-play"></i>
                        </a>`;
        playing = false;
        console.log("Playing: " + playing);
    } else if ( this.status == 401 ){
        refreshAccessToken();
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function handleUnpauseResponse(){
    console.log("play status = " + this.status);
    if (this.status == 204){
        const play = document.getElementById("playButton");
        play.innerHTML = `<a class="footer__play-button" id="playButton">
                            <i  style="font-size:2rem;padding-bottom:0px;color:white;" class="fa-solid fa-circle-pause"></i>
                        </a>`;
        playing = true;
        console.log("Playing: " + playing);
    } else if ( this.status == 401 ){
        refreshAccessToken();
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function playPause(){
    console.log("isPlaying: " + playing);
    console.log("device id = " + currentDeviceId);
    try {
        if(currentDeviceId){
            if(playing){
                callApi("PUT", PAUSE + "?device_id=" + currentDeviceId, null, handlePauseResponse);
            } else {
                callApi("PUT", PLAY + "?device_id=" + currentDeviceId, null, handleUnpauseResponse);
            }
        }
        } catch (err){
            console.log("Can't play the song right now");
        }
    
}

function handleSkip(){
    if (this.status == 204){
        console.log('Trying to skip!');
        
        setTimeout(getCurrent(), 2000);
        
        
    } else if ( this.status == 401 ){
        refreshAccessToken();
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function next(){
    try{
        callApi("POST", NEXT + "?device_id=" + currentDeviceId, null, handleSkip);
        } catch(err){
            console.log("Couldn't skip");
        }
}

function prev(){
    try{
        callApi("POST", PREV + "?device_id=" + currentDeviceId, null, handleSkip);
        } catch(err){
            console.log("Couldn't skip");
        }
}

function shuffle(){
    if(shuffled){
        callApi("PUT", SHUFFLE + "?device_id=" + currentDeviceId + "&state=false", null, handleShuffle);
    } else {
        callApi("PUT", SHUFFLE + "?device_id=" + currentDeviceId + "&state=true", null, handleShuffle);
    }
}

function handleShuffle(){
    if (this.status == 204){
        if(shuffled){
            shuffleButton.style.color = "#c3c1c1";
            shuffled = false;
            console.log("Unshuffled");
        } else {
            shuffleButton.style.color = "rgb(94, 167, 39)";
            shuffled = true;
            console.log("Shuffled");
        }
               
    } else if ( this.status == 401 ){
        refreshAccessToken();
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function handleLoop(){
    if (this.status == 204){
        if(looped){
            loopButton.style.color = "#c3c1c1";
            looped = false;
            console.log("Not looping");
        } else {
            loopButton.style.color = "rgb(94, 167, 39)";
            looped = true;
            console.log("Looping");
        }
              
    } else if ( this.status == 401 ){
        refreshAccessToken();
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function loop(){
    if(looped){
        callApi("PUT", LOOP + "?state=off" + "&device_id=" + currentDeviceId, null, handleLoop);
    } else {
        callApi("PUT", LOOP + "?state=context" + "&device_id=" + currentDeviceId, null, handleLoop);
}
}
    