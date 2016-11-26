// Start behaviour when DOM is ready
document.addEventListener('DOMContentLoaded', function(){

    // Check for configuration
    config_check();

    // Authorize usage over OAuth
    getAccessToken();

    // Initiate music master control
    window.mjs = new MusicMaster(MJSWebUI.config.mjs.endpoint);

    // Load top-level directory entries and display them
    var songinfo = document.querySelector('#songinfo .songs');
    mjs.files.listBrowse(processBrowseCapabilities, fatal_error);

    // Load the player
    mjs.players.getMjs(function(players){
        initiatePlayer(players[0]);
    });
});

/**
 * Checks if the required configuration object is present
 * @return {undefined}
 */
function config_check()
{
    if (window.MJSWebUI === undefined || window.MJSWebUI.config === undefined) {
        fatal_error('Configuration object is missing');
        throw new Error('Configuration object is missing');
    }
}

/**
 * Retrieves an access token from the OAuth authorization server
 * @return {undefined}
 */
function getAccessToken()
{
    var oauth = new OAuth(MJSWebUI.config.oauth.endpoint,
                          MJSWebUI.config.oauth.client_id,
                          MJSWebUI.config.oauth.client_secret,
                          MJSWebUI.config.oauth.redirect_uri,
                          MJSWebUI.config.oauth.resource);
    var authorization = oauth.check();
    authorization.then(function(access_token){
        MusicMaster.accessToken = access_token;
        history.pushState(null, '', MJSWebUI.config.oauth.redirect_uri);
    }, function(error){
        if (error === 'login_redirection') {
            return;
        }
        else {
            fatal_error('Authentication failed. You are probably not authorised to use this.')
        }
    });
}

/**
 * Initiate a player object
 * @param  {MjsPlayer} player
 * @return {undefined}
 */
function initiatePlayer(player)
{
    window.player = player;

    var remove = function(item, index){
        var root = document.getElementById('playlist');
        var entry = root.childNodes[index];

        root.removeChild(entry);
    }

    var move = function(item, pindex, nindex)
    {
        var root = document.getElementById('playlist');
        var entry = root.childNodes[pindex];

        root.removeChild(entry);

        if(root.childNodes.length == nindex)
            root.appendChild(entry);
        else
            root.insertBefore(entry, root.childNodes[nindex]);
    }

    var insert = function(song, index){
        song.onMove = move;
        song.onRemove = remove;

        var playlistUI = document.getElementById('playlist');

        var entry = build_entry_ui(song);
        entry.uri = song.uri;
        if(playlistUI.childNodes.length == index) {
            playlistUI.appendChild(entry);
        }
        else {
            playlistUI.insertBefore(entry, playlistUI.childNodes.length[index]);
        }
    }

    player.playlist.prefetch = true;
    player.playlist.onAdd = insert;

    showLoader(document.getElementById('songinfo'));
    makeDropTarget();

    enableControls(player);
    setTimeout(updatePlayerState, 1000);
}

function updatePlayerState()
{
    player.update(function(result){
        setPlayButton(window.player.status);
        updatePlaylistState();
        setTimeout(updatePlayerState, 1000);
    }, fatal_error, true);
}

function updatePlaylistState()
{
    var currentUri = window.player.currentItem;
    var playlistRoot = document.getElementById("playlist");
    for(var i = 0; i < playlistRoot.childNodes.length; i++)
    {
        if(playlistRoot.childNodes[i].uri == currentUri)
        {
            var current = playlistRoot.childNodes[i];

            if(playlistRoot.currentSelected !== current)
                clear_song_progress(playlistRoot.currentSelected);

            playlistRoot.currentSelected = current;
            draw_song_progress(current, window.player.position, window.player.duration);
        }
    }
}

function makeDropTarget()
{
    var playlist = document.getElementById('playlist');

    // Do not remove, these event handlers are needed for dragging to work
    playlist.addEventListener('dragenter', function(event) {
        event.preventDefault();
    });
    playlist.addEventListener('dragover', function(event) {
        event.preventDefault();
    });

    playlist.addEventListener('drop', dropSongOnPlaylist);
}

function dropSongOnPlaylist(event)
{
    event.preventDefault();
    var data = JSON.parse(event.dataTransfer.getData('application/json'));
}

/**
 * Initiate the controls for a player
 * @param  {MjsPlayer} player
 * @return {undefined}
 */
function enableControls(player)
{
    /*
     * Clear playlist
     */
    document.getElementById('control-clear').addEventListener('click', function(event){
        if (confirm("Weet je zeker dat je de hele playlist wilt wissen?")) {
            // FIXME implement button behaviour
            alert('not implemented');
        }
    });

    /*
     * Stop button
     */
    document.getElementById('control-stop').addEventListener('click', function(event){
        event.preventDefault();
        window.player.stop(function(){}, fatal_error);
    });

    /*
     * Play/pause button
     */
    var control = document.getElementById('control-play');
    setPlayButton(window.player.status || 'stopped')

    // Add click listener
    control.addEventListener('click', function(event){
        event.preventDefault();

        if (this.state == 'playing') {
            setPlayButton('paused');
            window.player.pause(function(){}, fatal_error);
        }
        else {
            setPlayButton('playing');
            window.player.play(function(){}, fatal_error);
        }
    });
}

function showPlaylist()
{
    player.playlist.items.forEach(function(playlistItem){
        playlistItem.getSong(function(song){
            document.getElementById('playlist').innerHTML += build_entry_ui(song);
        }, function(error) {
            return; // No song data is available
        });
    });
}

/**
 * Process all browseCapabilities and add their contents to the UI
 * @param  {Array} browseCapabilities
 * @return {undefined}
 */
function processBrowseCapabilities(browseCapabilities)
{
    browseCapabilities.forEach(function(browseCapability) {
        browseCapability.open(openDirectory, fatal_error);
    });
}

/**
 * Open a directory and add all its entries to the UI
 * @param  {Directory} Directory
 * @return {undefined}
 */
function openDirectory(directory)
{
    // Clear the list
    songinfo.innerHTML = '';

    // Append a Up()-call if needed
    if (directory.previous) {
        songinfo.appendChild(build_up_entry(directory.previous));
    }

    directory.entries.forEach(function(entryURL){
        directory.open(entryURL, function(entry){
            var element = build_entry_ui(entry);
            songinfo.appendChild(element);
        }, fatal_error);
    });
}

function build_up_entry(directory)
{
    var up = document.createElement('div');
    up.classList.add('entry', 'up');
    up.entry = directory;
    up.innerHTML ='<img src="images/directory.svg" alt="Directory" class="icon"> \
                        <span class="title">&hellip;</span>';
    up.addEventListener('click', function(event){
        event.preventDefault();
        openDirectory(this.entry);
    });
    return up;
}

/**
 * Show a fatal error to the user
 * @param  {string} details technical details of the error
 * @return {undefined}
 */
function fatal_error(details)
{
    console.error(details);
    alert('Fatal error\n\nTechnical details: '+details.toString());
}

/**
 * Draw the song in progress indicator
 * @param  {DOMObject} song the song to affect
 * @param  {int} current number of seconds into the song
 * @param  {int} total  total length of the song in seconds
 * @return {undefined}
 */
function draw_song_progress(song, current, total)
{
    var percentage = Math.ceil(100*current/total, 0);
    song.style.background = 'linear-gradient(to right,  #cdeb8e 0%,#cdeb8e '+percentage+'%,#ffffff '+percentage+'%)';
}

function clear_song_progress(song)
{
    if(song === undefined)
        return;
    song.style.background = 'white';
}

/**
 * Construct a song entry
 * @param  {Object} entry valid entry from mjs client
 * @return {String}       HTML-description
 */
function build_entry_ui(data)
{
    if (data.type == 'directory') {
        return build_directory_ui(data);
    }
    else {
        return build_song_ui(data);
    }
}

/**
 * Builds the UI element for a directory
 * @param  {array} data the data object describing the directory
 * @return {HTMLelement}      the rendered HTML
 */
function build_directory_ui(data)
{
    data.name = (data.name == 'unknown' ? 'Unknown album' : data.name);

    var element = document.createElement('div');
    element.classList.add('entry', 'directory');
    element.entry = data;
    element.innerHTML ='<img src="images/directory.svg" alt="Directory" class="icon"> \
                        <span class="title">' + data.name + '</span>';

    element.addEventListener('click', function(event){
        event.preventDefault();
        openDirectory(this.entry);
    });
    return element;
}

/**
 * Builds the UI element for a song
 * @param  {array} data the data object describing the song
 * @return {String}      the rendered HTML
 */
function build_song_ui(data)
{
    if(data.song !== undefined)
        data = data.song;

    // Normalize some data for displaying
    data.title = data.title || data.location.split('/').pop().split('.')[0].capitalize();
    data.artist = data.artist || 'Unknown artist';
    if (data.length) {
        var minutes = Math.floor(data.length / 60);
        var seconds = data.length % 60;
        if (seconds < 10) {
            seconds = "0" + seconds;
        }
        data.length = minutes + ":" + seconds;
    }
    else {
        data.length = "Unknown length";
    }

    // Create new element
    var element = document.createElement('div');
    element.classList.add('entry', 'song');
    element.entry = data;
    element.innerHTML ='<img src="images/song.svg" alt="Song" class="icon"> \
                        <span class="title">' + data.title + '</span> \
                        <span class="length">' + data.length + '</span> \
                        <br> \
                        <span class="artist">' + data.artist + '</span> ';

    // Define element behaviour
    element.draggable = true;
    element.addEventListener('dragstart', function(event){
        event.dataTransfer.setData("application/json", JSON.stringify(this.entry));
    });

    return element;
}

/**
 * Clear the element and show a loading icon in it
 * @param  {HTMLelement} element the element to replace
 * @return {undefined}
 */
function showLoader(element)
{
    element.innerHTML = '<img src="images/loader.gif" width=128 height=15 class=loader />';
    setTimeout(function(element){
        element.innerHTML += '<p class="loader-explanation">This is taking longer than expected. Is it turned on?</p>';
    }, 5000, element);
}

/**
 * updates the state and UI of the play/pause button
 * @param {String} state the status of the player, either "playing", "paused", "stopped" or something else
 */
function setPlayButton(state)
{
    var control = document.getElementById('control-play');
    var icon = control.children[0];
    control.state = state;
    if (state == 'playing') {
        icon.src = 'images/pause.svg';
    }
    else {
        icon.src = 'images/play.svg';
    }
}
