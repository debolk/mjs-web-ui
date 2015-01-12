// Start behaviour when DOM is ready
document.addEventListener('DOMContentLoaded', function(){

    // Authorize usage over OAUTH
    var oauth = new OAuth('https://auth.debolk.nl',
                          'mjs-web-ui-development',
                          'CNKewWhCu6',
                          'http://mjswebui.dev/',
                          'mp3control');
    var authorization = oauth.check();
    authorization.then(function(access_token){
        window.access_token = access_token;
        history.pushState(null, '', 'http://mjswebui.dev/');
    }, function(error){
        fatal_error('Authentication failed. You are probably not authorised to use this.')
    });

    // Initiate music master control
    window.mjs = new MusicMaster('http://www.delftelectronics.nl/musicmaster/');

    // Load top-level directory entries and display them
    var songinfo = document.querySelector('#songinfo .songs');
    mjs.files.listBrowse(processBrowseCapabilities, fatal_error);

    // Load the player
    mjs.players.getMjs(function(players){
        initiatePlayer(players[0]);
    });
});

/**
 * Initiate a player object
 * @param  {MjsPlayer} player
 * @return {undefined}
 */
function initiatePlayer(player)
{
    window.player = player;

    player.getPlaylist(showPlaylist, fatal_error);
    enableControls(player);
}

/**
 * Initiate the controls for a player
 * @param  {MjsPlayer} player
 * @return {undefined}
 */
function enableControls(player)
{
    // Bind click handlers to button
    // button_handler(document.getElementById('control-clear'), player.clear);
    // button_handler(document.getElementById('control-search'), player.search);
    // button_handler(document.getElementById('control-shuffle'), player.shuffle);
    button_handler(document.getElementById('control-previous'), player.previous);
    button_handler(document.getElementById('control-stop'), player.stop);
    button_handler(document.getElementById('control-play'), player.play);
    button_handler(document.getElementById('control-forward'), player.next);

    // Add keyboard controls
    document.addEventListener('keyup', function(event){
        var el;
        switch (event.keyCode)
        {
            case 67:    // C - clear
            {
                el = document.getElementById('control-clear'); break;
            }
            case 70:    // F - search (find)
            {
                el = document.getElementById('control-search'); break;
            }
            case 83:    // S - stop
            {
                el = document.getElementById('control-stop'); break;
            }
            case 37:    // Left - previous song
            {
                el = document.getElementById('control-previous'); break;
            }
            case 72:    // H - stop (halt)
            {
                el = document.getElementById('control-stop'); break;
            }
            case 32:    // Space - play/pause
            {
                el = document.getElementById('control-play'); break;
            }
            case 39:    // Right - forward song
            {
                el = document.getElementById('control-forward'); break;
            }
            default:
            {
                return; // KeyCode not caught, proceed normally
            }
        }
        event.preventDefault();
        event = document.createEvent('HTMLEvents');
        event.initEvent('click', true, false);
        el.dispatchEvent(event);
    });
}

function button_handler(button, callback)
{
    button.addEventListener('click', function(event){
        event.preventDefault();
        callback.apply(window.player, [function(){}, function(){}]);
    });
}

function showPlaylist(playlist)
{
    window.playlist = playlist;
    playlist.items.forEach(function(playlistItem){
        playlistItem.getSong(function(song){
            document.getElementById('playlist').innerHTML += build_entry_ui(song);
        }, function(error) {
            return; // No song data is available
        });
    });

    // // Highlight currently playing song
    // player.getCurrent(function(song){
    //     if (song === {}) {
    //         return; // No song currently playing
    //     }
    //     // // Find current song in UI
    //     // var song = undefined;
    //     // // Highlight progress in song
    //     // draw_song_progress(song, 40, 100);
    // }, fatal_error);
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
    directory.entries.forEach(function(entryURL){
        directory.open(entryURL, function(entry){
            songinfo.innerHTML += build_entry_ui(entry);
        }, fatal_error);
    });
}

/**
 * Show a fatal error to the user
 * @param  {string} details technical details of the error
 * @return {undefined}
 */
function fatal_error(details)
{
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
    var percentage = Math.round(100*current/total, 0);
    song.style.background = 'linear-gradient(to right,  #cdeb8e 0%,#cdeb8e '+percentage+'%,#ffffff '+percentage+'%)';
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
 * @return {String}      the rendered HTML
 */
function build_directory_ui(data)
{
    data.name = (data.name == 'unknown' ? 'Unknown album' : data.name);

    return '<div class="entry directory"> \
                <img src="images/directory.svg" alt="Directory" class="icon"> \
                <span class="title">' + data.name + '</span> \
            </div>';
}

/**
 * Builds the UI element for a song
 * @param  {array} data the data object describing the song
 * @return {String}      the rendered HTML
 */
function build_song_ui(data)
{
    data.title = data.title || data.location.split('/').pop().split('.')[0].capitalize();
    data.length = data.length || 'Unknown length';
    data.artist = data.artist || 'Unknown artist';

    return '<div class="entry song"> \
                <img src="images/song.svg" alt="Song" class="icon"> \
                <span class="title">' + data.title + '</span> \
                <span class="length">' + data.length + '</span> \
                <br> \
                <span class="artist">' + data.artist + '</span> \
            </div>';
}

/**
 * Starts keyboard navigation throughout songinfo and playlist
 * @return {undefined}
 */
function initiate_keyboard_navigation()
{
    var a = document.querySelector('#songinfo .entry');
    var b = document.querySelector('#playlist .entry');
    var keyboardNavigator = new KeyboardNavigator(a, a, b);
    document.addEventListener('keyup', function(event){
        switch (event.keyCode)
        {
            case 40:    // arrow down
            {
                keyboardNavigator.next(); break;
            }
            case 38:    // arrow up
            {
                keyboardNavigator.previous(); break;
            }
            case 9:    // Tab
            {
                keyboardNavigator.switch(); break;
            }
            default:
            {
                return; // KeyCode not caught, proceed normally
            }
        }
        event.preventDefault();
    });
}
