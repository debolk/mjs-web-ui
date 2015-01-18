/**
 * Creates a new KeyboardNavigator
 * @constructor
 * @param {HTMLelement} songinfo the songinfo list
 * @param {HTMLelement} playlist the playlist
 */
function KeyboardNavigator(songinfo, playlist){
    songinfo = new Cursor(songinfo);
    playlist = new Cursor(playlist);
    songinfo.next = playlist;
    playlist.next = songinfo;

    this.cursors = [songinfo, playlist];
    this.current_cursor = songinfo;
};

/**
 * Class definition of KeyboardNavigator
 * @class
 */
KeyboardNavigator.prototype = {
    cursors: null,
    current_cursor: null,

    switch: function() {
        this.current_cursor = this.current_cursor.next;
        this.current_cursor._set_cursor();
    },

    next: function() {
        this.current_cursor.advance();
    },

    previous: function() {
        this.current_cursor.retreat();
    },

    reset: function() {
        this.current_cursor = this.cursors[0];
        this.current_cursor._select_first();
    }
};

/**
 * Creates a Cursor object
 * @constructor
 * @param {HTMLelement} element the HTML element this cursor initially points to
 */
function Cursor(list)
{
    this.list = list;

    // Select the first element if present
    this.advance();
}

/**
 * Cursor class definition
 * @class
 */
Cursor.prototype = {
    list: null,
    element: null,
    next: null,

    advance: function() {
        if (this.element === null) {
            return this._select_first();
        }
        if (this.element.nextElementSibling === null) {
            return;
        }
        this.element = this.element.nextElementSibling;
        this._set_cursor();
    },

    retreat: function() {
        if (this.element === null) {
            return this._select_first();
        }
        if (this.element.previousElementSibling === null) {
            return;
        }
        this.element = this.element.previousElementSibling;
        this._set_cursor();
    },

    _set_cursor: function() {
        if (this.element === null) {
            return this._select_first();
        }

        var entries = document.querySelectorAll('.entry');
        Array.prototype.forEach.call(entries, function(entry, i) {
            entry.classList.remove('cursor');
        });
        this.element.classList.add('cursor');
    },

    _select_first: function() {
        if (this.list.children.length > 0) {
            this.element = this.list.children[0];
            this._set_cursor();
        }
    },
};
