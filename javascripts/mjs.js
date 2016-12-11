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
    mjs.files.listBrowse(processBrowseCapabilities, maybe_offline_error);

    // Load the player
    mjs.players.getMjs(function(players){
        initiatePlayer(players[0]);
    });
});

// Types used for ordering entries and sorting
Types = { up: 0, directory: 1, song: 2 };

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
        var entry = root.querySelectorAll('.entry')[index];

        root.removeChild(entry);
    }

    var move = function(item, pindex, nindex)
    {
        var root = document.getElementById('playlist');
        var entries = root.querySelectorAll('.entry');
        var entry = entries[pindex];

        root.removeChild(entry);

        if(root.entries.length == nindex)
            root.appendChild(entry);
        else
            root.insertBefore(entry, root.entries[nindex]);
    }

    var insert = function(song, index){
        song.onMove = move;
        song.onRemove = remove;

        var playlistUI = document.getElementById('playlist');

        var entry = build_playlist_entry(song);
        entry.uri = song.uri;
        if(playlistUI.childNodes.length == index) {
            playlistUI.appendChild(entry);
        }
        else {
            playlistUI.insertBefore(entry, playlistUI.childNodes[index]);
        }
    }

    player.playlist.prefetch = true;
    player.playlist.onAdd = insert;

    enableControls(player);
    setTimeout(updatePlayerState, 1000);
}

function updatePlayerState()
{
    player.update(function(result){
        setPlayButton(window.player.status);
        updatePlaylistState();
        setTimeout(updatePlayerState, 1000);
    }, function(error){
       fatal_error(error);
       setTimeout(updatePlayerState, 1000);
    });
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

            if(playlistRoot.playingSongElement !== undefined && playlistRoot.playingSongElement !== current) {
                clear_song_progress(playlistRoot.playingSongElement);
                // when a new song starts playing, scroll to the previous song (showing that one and the new one on top)
                playlistRoot.playingSongElement.scrollIntoView({behavior: 'smooth', block: 'start'});
            }

            playlistRoot.playingSongElement = current;
            draw_song_progress(current, window.player.position, window.player.duration);
        }
    }
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
        if (confirm("Playlist wissen?")) {
            window.player.playlist.clear(function(){}, fatal_error);
        }
    });

    /*
     * Clear playlist
     */
    document.getElementById('control-shuffle').addEventListener('click', function(event){
        if (confirm("Playlist shufflen?")) {
            var current_song = window.player.currentState;
            window.player.playlist.shuffle(current_song, function(){}, fatal_error);
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
     * Backward button
     */
    document.getElementById('control-backward').addEventListener('click', function(event){
        event.preventDefault();
        window.player.previous(function(){}, fatal_error);
    });

    /*
     * Forward button
     */
    document.getElementById('control-forward').addEventListener('click', function(event){
        event.preventDefault();
        window.player.next(function(){}, fatal_error);
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

    // Store the current directory in the UI for comparison later
    songinfo.currentDirectory = directory;

    // Append a Up()-call if needed
    if (directory.previous) {
        insertDirectoryElementOrdered(build_up_entry(directory.previous));
    }

    directory.entries.forEach(function(entryURL){
        directory.open(entryURL, function(entry){
            if (isValidEntry(entry)) {
                // Construct appropriate UI element
                var element = build_entry_ui(entry);
                // Check if the item we are about to render is contained in the current directory
                // (that might seem superfluous, but we might have navigated away in the meantime)
                if (isContainedIn(songinfo.currentDirectory, entry)) {
                    insertDirectoryElementOrdered(element);
                }
            }
            else {
                console.log("Not a valid entry to play or open", entry);
            }
        }, fatal_error);
    });
}

/**
 * Determine whether an entry is contained in a directory
 * @param  {Directory}  directory
 * @param  {Directory | Song}  entry
 * @return {Boolean}
 */
function isContainedIn(directory, entry) {
    if (entry.type === 'directory') {
        return entry.previous === directory;
    }
    if (entry.type === 'song') {
        return directory.entries.includes(entry.uri);
    }
}

/**
 * Check if an entry is valid for this player: must be either a directory, or a valid MP3-file.
 * Checked by type == directory, or location ends with "/record" (tagged) or ".mp3" (mp3 file)
 * @param  {Directory | Song}  entry
 * @return {Boolean}
 */
function isValidEntry(entry) {
    if (entry.type === 'directory') {
        return true;
    }

    if (entry.location.substr(-6) === 'record') {
        return true;
    }

    if (entry.location.substr(-4) === '.mp3') {
        return true;
    }

    return false;
}

function build_up_entry(directory)
{
    var up = document.createElement('div');
    up.classList.add('entry', 'up');
    up.entry = directory;
    up.ordering = {
        entryType: Types.up,
        description: "...",
    };
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
    if (details.status === 502) {
        alert('Kan de mp3bak niet bereiken. Misschien is deze gecrasht of uitgezet?');
    }
    else {
        alert('Fatal error\n\nTechnical details: '+JSON.stringify(details));
    }
}

/**
 * Show a fatal error to the user indicating they are probably not on the local network
 * @param  {string} details technical details of the error
 * @return {undefined}
 */
function maybe_offline_error(details)
{
    console.error(details);
    alert('Kan de muziekserver niet bereiken. Ben je wel verbonden met Bolknet of kabel?');
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
    if (song === undefined || song.style === undefined) {
        return;
    }
    var percentage = Math.ceil(100*current/total, 0);
    song.style.background = 'linear-gradient(to right,  #cdeb8e 0%,#cdeb8e '+percentage+'%,#ffffff '+percentage+'%)';
}

function clear_song_progress(song)
{
    if(song === undefined || song.style === undefined) {
        return;
    }
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
    element.ordering = {
        entryType: Types.directory,
        description: data.name,
    };

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
function build_song_ui(song)
{
    data = normalize_song_data(song);

    // Create new element
    var element = document.createElement('div');
    element.classList.add('entry', 'song');
    element.entry = data;
    element.innerHTML ='<img src="images/song.svg" alt="Song" class="icon"> \
                        <span class="title">' + data.title + '</span> \
                        <span class="length">' + data.length + '</span> \
                        <br> \
                        <span class="artist">' + data.artist + '</span> \
                        <span class="song-controls"> \
                            <button class=insert>Als volgende spelen</button> \
                            <button class=append>Toevoegen</button> \
                        </span>';
    element.ordering = {
        entryType: Types.song,
        description: data.title,
    };

    var append_button = element.querySelectorAll('.append')[0]
    append_button.addEventListener('click', function(event){
        event.preventDefault();
        window.player.playlist.append(song, function(){}, fatal_error);
    });

    var insert_button = element.querySelectorAll('.insert')[0];
    insert_button.addEventListener('click', function(event) {
        event.preventDefault();
        window.player.getCurrentItem(function(item) {
            var id = window.player.playlist.items.indexOf(item);
            if (id == -1)
                id = window.player.playlist.items.length - 1;
            if (id >= window.player.playlist.items.length) {
                window.player.playlist.append(song, function(){}, fatal_error);
            } else {
                var next = window.player.playlist.items[id];
                window.player.playlist.insert(song, next, function(){}, fatal_error);
            }
        }, fatal_error);
    })
    return element;
}

/**
 * Take the inconsitent data of a song and add defaults, etc.
 * @param  {Object} data
 * @return {Object}
 */
function normalize_song_data(data) {
    if(data.song !== undefined) {
        data = data.song;
    }

    if (! data.title) {
        var filename = data.uri.split('/').pop().split('.')[0].capitalize();
        data.title = decodeURIComponent((filename+'').replace(/\+/g, '%20'));
    }

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
        data.length = "";
    }

    return data;
}

/**
 * Builds the UI element for a playlist item
 * @param  {array} data properties of a song
 * @return {HTMLElement}
 */
function build_playlist_entry(song) {
    data = normalize_song_data(song);

    // Create new element
    var element = document.createElement('div');
    element.classList.add('entry', 'song');
    element.entry = data;
    element.innerHTML ='<img src="images/song.svg" alt="Song" class="icon"> \
                        <span class="title">' + data.title + '</span> \
                        <span class="length">' + data.length + '</span> \
                        <br> \
                        <span class="artist">' + data.artist + '</span> \
                        <span class="song-controls"><button class=remove>Verwijderen</button></span>';

    var button = element.querySelectorAll('.remove')[0];
    button.addEventListener('click', function(event){
        event.preventDefault();

        // If deleting the currently playin song, skip to next song first
        if (song.uri === window.player.currentState.url) {
            window.player.next(function(){}, fatal_error);
        }

        song.remove(function(){}, fatal_error);
    });

    return element;
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

/**
 * Inserts an entry in the 'good position' in the directory browser. Basic rules:
 * 1) never before the "up" entry
 * 2) directories first, songs second
 * 3) sorted alphabetically by displayed title
 *
 * @param  {DOMelement} entry
 * @param  {DOMelement} directory
 * @return {void}
 */
function insertDirectoryElementOrdered(entry) {
    // Append if this is going to be the only entry
    if (songinfo.children.length == 0) {
        songinfo.appendChild(entry);
        return;
    }

    var items = songinfo.getElementsByClassName('entry');
    for (item of items) {
        if (directoryOrderingComparator(entry, item) <= 0) {
            songinfo.insertBefore(entry, item);
            return;
        }
    }

    // No match, insert as the last entry
    songinfo.appendChild(entry);
}

/**
 * Compare two entries in the directory browser for ordering
 * @param  {HTMLelement} a
 * @param  {HTMLelement} b
 * @return {int}
 */
function directoryOrderingComparator(a, b) {

    if (a.ordering.entryType != b.ordering.entryType) {
        return a.ordering.entryType - b.ordering.entryType;
    }

    if (a.ordering.description != b.ordering.description) {
        return a.ordering.description.localeCompare(b.ordering.description);
    }
}
