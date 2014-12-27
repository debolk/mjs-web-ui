// Start behaviour when DOM is ready
document.addEventListener('DOMContentLoaded', function(){

    // // Initiate music master control
    // mjs = new MusicMaster('http://www.delftelectronics.nl/musicmaster/');
    // mjs.players.listMjs();

    // Testing code for drawing the progress unit
    var song = document.querySelector('.song');
    var i = 0;
    setInterval(function(){
        song.style.background = 'linear-gradient(to right,  #cdeb8e 0%,#cdeb8e '+i+'%,#ffffff '+i+'%)';
        i++;
    }, 10);

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
