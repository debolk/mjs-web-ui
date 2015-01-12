/**
 * Creates a new KeyboardNavigator
 * @constructor
 * @param {HTMLelement} pointer  the HTML element at which we start, must be identical to either the songinfo or playlist argument
 * @param {HTMLelement} songinfo the HTML element at which the songinfo list starts
 * @param {HTMLelement} playlist the HTML element at which the playlist starts
 */
function KeyboardNavigator(pointer, songinfo, playlist){
    songinfo = new Cursor(songinfo);
    playlist = new Cursor(playlist);
    songinfo.next = playlist;
    playlist.next = songinfo;

    this.cursors = [songinfo, playlist];
    this.current_cursor = songinfo;
    this.current_cursor._set_cursor(this.current_cursor.element);
};

/**
 * Class definition of KeyboardNavigator
 * @class
 */
KeyboardNavigator.prototype = {
    cursors: undefined,
    current_cursor: undefined,

    switch: function() {
        this.current_cursor = this.current_cursor.next;
        this.current_cursor._set_cursor(this.current_cursor.element);
    },

    next: function() {
        this.current_cursor.advance();
    },

    previous: function() {
        this.current_cursor.retreat();
    },
};

/**
 * Creates a Cursor object
 * @constructor
 * @param {HTMLelement} element the HTML element this cursor initially points to
 */
function Cursor(element)
{
    this.element = element;
}

/**
 * Cursor class definition
 * @class
 */
Cursor.prototype = {
    element: undefined,
    next: undefined,

    advance: function() {
        if (this.element.nextElementSibling === null) {
            return;
        }
        this.element = this.element.nextElementSibling;
        this._set_cursor(this.element);
    },

    retreat: function() {
        if (this.element.previousElementSibling === null) {
            return;
        }
        this.element = this.element.previousElementSibling;
        this._set_cursor(this.element);
    },

    _set_cursor: function(element) {
        var entries = document.querySelectorAll('.entry');
        Array.prototype.forEach.call(entries, function(entry, i) {
            entry.classList.remove('cursor');
        });
        element.classList.add('cursor');
    },
};
