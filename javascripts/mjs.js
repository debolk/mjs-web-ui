// Start behaviour when DOM is ready
document.addEventListener('DOMContentLoaded', function(){

    // Setup handlebars
    window.directory_template = Handlebars.compile(document.getElementById('directory_template').innerHTML);
    window.song_template = Handlebars.compile(document.getElementById('song_template').innerHTML);
    Handlebars.registerHelper('output', function (value, backup) {
        return new Handlebars.SafeString(value || backup);
    });

    // Initiate music master control
    window.mjs = new MusicMaster('http://www.delftelectronics.nl/musicmaster/');
    // Start browser
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
    console.log(details);
    // alert('Fatal error\n\nTechnical details: '+details.toString());
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
    console.log(data);

    if (data.type == 'directory') {
        return directory_template(data);
    }
    else {
        return song_template(data);
    }
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