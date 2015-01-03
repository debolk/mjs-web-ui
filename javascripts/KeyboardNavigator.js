function KeyboardNavigator(pointer, songinfo, playlist){
    songinfo = new Cursor(songinfo);
    playlist = new Cursor(playlist);
    songinfo.next = playlist;
    playlist.next = songinfo;

    this.cursors = [songinfo, playlist];
    this.current_cursor = songinfo;
    this.current_cursor._set_cursor(this.current_cursor.element);
};

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

function Cursor(element)
{
    this.element = element;
}

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
    }
};
