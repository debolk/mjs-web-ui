// Start behaviour when DOM is ready
document.addEventListener('DOMContentLoaded', function(){

    // Compile handlebars templates
    window.song_template = Handlebars.compile(document.getElementById('song-template').innerHTML);

    // Initiate music master control
    window.mjs = new MusicMaster('http://www.delftelectronics.nl/musicmaster/');
    // Start browser
    mjs.files.listBrowse(function(browseCapability){
        browseCapability[0].open(function(directory){
            // Insert all root-level entries in interface
            var list = document.querySelector('#songinfo .songs');
            Array.prototype.forEach.call(directory.entries, function(song, i) {
                list.innerHTML = list.innerHTML + build_song_UI(song);
                console.log(song);
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
    document.getElementById('control-forward').addEventListener('click', mjs.forward);

    // Keyboard shortcuts
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
    });*/
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
 * @param  {Directory} song directory from mjs client
 * @return {String}       HTML-description
 */
function build_song_UI(song)
{
    return song_template({title: song});
}
