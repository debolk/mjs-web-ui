// Start behaviour when DOM is ready
document.addEventListener('DOMContentLoaded', function(){

    // Initiate music master control
    window.mjs = new MusicMaster('http://www.delftelectronics.nl/musicmaster/');

    // Load top-level directory entries and display them
    var songinfo = document.querySelector('#songinfo .songs');
    mjs.files.listBrowse(function(browseCapability){
        browseCapability[0].open(function(directory){
            // Iterate over all entries and open them
            directory.entries.forEach(function(entry){
                directory.open(entry, function(entry){
                    songinfo.innerHTML += build_entry_ui(entry);
                }, fatal_error);
            });
        }, fatal_error);
    }, fatal_error);

    // Load the player
    var playlistUI = document.getElementById('playlist');
    mjs.players.getMjs(function(players){
        window.player = players[0];
        // Load playlist
        player.getPlaylist(function(playlist){
            window.playlist = playlist;
            playlist.items.forEach(function(playlistItem){
                playlistItem.getSong(function(song){
                    playlistUI.innerHTML += build_entry_ui(song);
                }, function(error) {
                    // No song data is available
                    return;
                });
            });
        }, fatal_error);

        // Highlight currently playing song
        player.getCurrent(function(song){
            if (song === {}) {
                return; // No song currently playing
            }
            // // Find current song in UI
            // var song = undefined;
            // // Highlight progress in song
            // draw_song_progress(song, 40, 100);
        }, fatal_error);
    }, fatal_error);



    /*// Global event handlers (play, pause, etc)
    document.getElementById('control-clear').addEventListener('click', mjs.clear);
    document.getElementById('control-search').addEventListener('click', mjs.search);
    document.getElementById('control-shuffle').addEventListener('click', mjs.shuffle);
    document.getElementById('control-previous').addEventListener('click', mjs.previous);
    document.getElementById('control-stop').addEventListener('click', mjs.stop);
    document.getElementById('control-play').addEventListener('click', mjs.play);
    document.getElementById('control-forward').addEventListener('click', mjs.forward);*/

    // Keyboard for controls
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
});

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

function build_directory_ui(data)
{
    data.name = data.name || 'Unknown album';

    return '<div class="entry directory"> \
                <img src="images/directory.svg" alt="Directory" class="icon"> \
                <span class="title">' + data.name + '</span> \
            </div>';
}

// <script id="song_template" type="text/x-handlebars-template">
//     </script>

function build_song_ui(data)
{
    data.title = data.title || 'Unknown title';
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