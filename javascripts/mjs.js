// Start behaviour when DOM is ready
document.addEventListener('DOMContentLoaded', function(){

    // Initiate music master control
    mjs = new MusicMaster('http://www.delftelectronics.nl/musicmaster/');

    // Testing code for drawing the progress unit
    var song = document.querySelector('.song');
    var i = 0;
    setInterval(function(){
        song.style.background = 'linear-gradient(to right,  #cdeb8e 0%,#cdeb8e '+i+'%,#ffffff '+i+'%)';
        i++;
    }, 10);

});
