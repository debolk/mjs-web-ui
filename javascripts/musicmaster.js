/**
 * Represents a reference to a browseable music repository
 * @constructor
 */
function BrowseCapability(plugin)
{
    this.uri = plugin.url + "/browse/";
    this.name = plugin.name;
}

/**
 * Returns a Directory representing the root of this repository.
 */
BrowseCapability.prototype.open = function(success, failure) { return Directory.fromUri(this.uri, success, failure); };
/**
 * Represents a directory in a music repository
 * @constructor
 */
function Directory(data, previous)
{
    /** Constant "directory" */
    this.type = "directory";

    /** The name of this directory */
    this.name = data.name;
    /** A list of subdirectories (as uri) */
    this.entries = data.entries;

    /** The parent directory or null if none */
    this.previous = previous;
}

/**
 * Parses a uri to a directory
 */
Directory.fromUri = function(uri, success, failure)
{
    MusicMaster.get(uri, function(request)
            {
                success(new Directory(request.responseJson));
            }, failure);
}

/**
 * Opens a subdirectory or a song and returns the corresponding object
 */
Directory.prototype.open = function(filename, success, failure)
{
    current = this;
    MusicMaster.get(filename, function(request)
            {
                var result = request.responseJson;
                if(result.type == "song")
                    success(new Song(filename, result));
                if(result.type == "directory")
                    success(new Directory(result, current));
            }, failure);
}
/**
 * A class for finding playable music
 * @constructor
 */
function Files(master)
{
    /** The MusicMaster object this is part of */
    this.master = master;
}

/**
 * Returns a list of plugins enabled on the musicmaster server
 */
Files.prototype.get = function(success, failure)
{
    this.master.get('plugin/',
            function(request) { success(request.responseJson.plugins); },
            failure);
}

/**
 * Returns a list of plugins that have the specified capability name
 */
Files.prototype.listCapability = function(name, success, failure)
{
    this.get(function(plugins){
        var result = [];
        for(var id in plugins)
        {
            var plugin = plugins[id];
            var matches = false;
            for(var capability_id in plugin.capabilities)
            {
                var capability = plugin.capabilities[capability_id];
                if(capability.name == name)
                    matches = true;
            }

            if(matches)
                result.push(plugin);
        }

        success(result);

    }, failure);
}

/**
 * Returns a list of BrowseCapability objects
 */
Files.prototype.listBrowse = function(success, failure)
{
    this.listCapability("browse", function(plugins)
            {
                var results = [];
                for(id in plugins)
                {
                    var plugin = plugins[id];
                    results.push(new BrowseCapability(plugin));
                }
                success(results);
            }, failure);
}

/**
 * Returns a list of SearchCapability objects
 */
Files.prototype.listSearch = function(success, failure)
{
    this.listCapability("search", success, failure);
}
/**
 * A class for interacting with an MJS client
 * @constructor
 */
function MjsPlayer(plugin)
{
    this.name = plugin.name;
    this.uri = plugin.url;
    this.playlist = new Playlist(this.uri + "/playlist", Array());
}

/**
 * Initializes this object with information on the remote player
 * @deprecated No longer neccecary, set player.playlist.prefetch = true;
 */
MjsPlayer.prototype.initialize = function(success, failure, prefetch)
{
    var orig = this;
    this.getPlaylist(function(playlist){
        orig.playlist = playlist;
        orig.update(success, failure);
    }, failure, prefetch);
}

/**
 * Updates the information with information on the remote player
 */
MjsPlayer.prototype.update = function(success, failure)
{
    var orig = this;
    if(this.playlist == undefined)
    {
        failure({"error": "Player not initialized"});
        return;
    }

    var count = 0;
    var errorRequest = undefined;

    var close = function()
    {
        count++;
        if(count < 3)
            return;

        if(errorRequest != undefined)
            failure(errorRequest);
        else
            success();
    }

    var error = function(request)
    {
        errorRequest = request;
        close();
    }

    this.playlist.update(close, error);
    this.getCurrent(function(state)
            {
                orig.currentState = state;
                orig.currentSong = state.song;
                orig.currentItem = state.url;
                orig.duration = state.duration;
                orig.position = state.position;

                if(orig.position == undefined)
                    orig.estimatedStart = undefined;
                else
                    orig.estimatedStart = Date.now() - Date(orig.position * 1000);

                close();
            }, error);
    this.getStatus(function(state)
            {
                orig.status = state;
                close();
            }, error);
}

/**
 * Returns a Playlist object
 */
MjsPlayer.prototype.getPlaylist = function(success, failure, prefetch)
{
    Playlist.fromUri(this.uri + "/playlist", success, failure, prefetch);
}

/**
 * Returns the current status of the player (playing, paused, stopped)
 */
MjsPlayer.prototype.getStatus = function(success, failure)
{
    MusicMaster.get(this.uri + "/status", function(request) {
        success(request.responseJson.status);
    }, failure);
}

/**
 * Sets the player status to a specific value (playing, paused, stopped)
 */
MjsPlayer.prototype.setStatus = function(status, success, failure)
{
    var data = {"status": status};
    MusicMaster.put(this.uri + "/status", data, success, failure);
}

/**
 * Returns the current playback status
 */
MjsPlayer.prototype.getCurrent = function(success, failure)
{
    MusicMaster.get(this.uri + "/current", function(request){
        success(request.responseJson);
    }, failure);
}

/**
 * Sets a specific PlaylistItem as current
 */
MjsPlayer.prototype.setCurrent = function(playlistItem, success, failure)
{
    MusicMaster.put(this.uri + "/current", {"uid": playlistItem.uri}, success, failure);
}

/**
 * Resume playback
 */
MjsPlayer.prototype.play = function(success, failure)
{
    this.setStatus("playing", success, failure);
}

/**
 * Pause playback
 */
MjsPlayer.prototype.pause = function(success, failure)
{
    this.setStatus("paused", success, failure);
}

/**
 * Stops playback
 */
MjsPlayer.prototype.stop = function(success, failure)
{
    this.setStatus("stopped", success, failure);
}

/**
 * Skips a number
 */
MjsPlayer.prototype.next = function(success, failure)
{
    MusicMaster.post(this.uri + "/current", {"action": "next"}, success, failure);
}

/**
 * Got o previous number
 */
MjsPlayer.prototype.previous = function(success, failure)
{
    MusicMaster.post(this.uri + "/current", {"action": "previous"}, success, failure);
}
/**
 * The root object of this library.
 * Create a MusicMaster object that points to your musicmaster server:
 *  var master = new MusicMaster("http://www.example.com/musicmaster/");
 * @constructor
 */
function MusicMaster(uri)
{
    this.uri = uri;
    this.get = function(path, success, failure) { MusicMaster.get(uri + path, success, failure); };

    this.players = new Players(this);
    this.files = new Files(this);
}

/**
 * Certain operations require authorization. For these operations a valid access token is required. This token can be obtained through oauth and set here.
 * The access token is global for all musicmasters.
 */
MusicMaster.accessToken = "";

//Utility functions

MusicMaster._onload = function(request, success, failure)
    {
        try
        {
            request.responseJson = JSON.parse(request.responseText);
        } catch (e) {
            console.log("Invalid json received: " + e.message);
            request.responseJson = {};
        }
        if(request.status >= 200 && request.status < 400)
        {
            success(request);
        }
        else
        {
            failure(request);
        }
    }

/**
 * Does an ajax GET request and aprses the results as JSON
 */
MusicMaster.get = function(uri, success, failure)
{
    var request = new XMLHttpRequest();
    request.open('GET', uri, true);
    request.onload = function() { MusicMaster._onload(request, success, failure); };
    request.onerror = failure;

    request.send();
}

/**
 * Does an ajax POST request with the given data and aprses the results as JSON
 */
MusicMaster.post = function(uri, data, success, failure)
{
    if(MusicMaster.accessToken != "")
    {
        if(uri.indexOf("?") == -1)
            uri = uri + "?access_token=" + MusicMaster.accessToken;
        else
            uri = uri + "&access_token=" + MusicMaster.accessToken;
    }

    var request = new XMLHttpRequest();
    request.open('POST', uri, true);
    request.onload = function() { MusicMaster._onload(request, success, failure); };
    request.onerror = failure;

    var encoding = JSON.stringify(data);

    request.send(encoding);
}

/**
 * Does an ajax DELETE request and aprses the results as JSON
 */
MusicMaster.delete = function(uri, success, failure)
{
    if(MusicMaster.accessToken != "")
    {
        if(uri.indexOf("?") == -1)
            uri = uri + "?access_token=" + MusicMaster.accessToken;
        else
            uri = uri + "&access_token=" + MusicMaster.accessToken;
    }


    var request = new XMLHttpRequest();
    request.open('DELETE', uri, true);
    request.onload = function() { MusicMaster._onload(request, success, failure); };
    request.onerror = failure;

    request.send();
}

/**
 * Does an ajax PUT request with the given data and aprses the results as JSON
 */
MusicMaster.put = function(uri, data, success, failure)
{
    if(MusicMaster.accessToken != "")
    {
        if(uri.indexOf("?") == -1)
            uri = uri + "?access_token=" + MusicMaster.accessToken;
        else
            uri = uri + "&access_token=" + MusicMaster.accessToken;
    }

    var request = new XMLHttpRequest();
    request.open('PUT', uri, true);
    request.onload = function() { MusicMaster._onload(request, success, failure); };
    request.onerror = failure;

    request.send(JSON.stringify(data));
}

/**
 * Awaits multiple callback functions
 */
MusicMaster.waitFor = function(functions, success, failure)
{
    var total = functions.length;
    var left = total;
    var errorMessage = undefined;

    var close = function()
    {
        total--;
        if(total > 0)
            return;

        if(errorRequest != undefined)
            failure(errorRequest);
        else
            success();
    }

    for(var i = 0; i < total; i++)
        functions[i](close, function(e) { errorMessage = e; close(); });
}
/**
 * A class for finding players
 * @constructor
 */
function Players(master)
{
    this.master = master;
}

/**
 * Fetches the list of players
 */
Players.prototype.get = function(success, failure)
{
    this.master.get('player',
            function(request) { success(request.responseJson.players); },
            failure);
}

/**
 * Returns a list of players that have a specified capability name
 */
Players.prototype.getCapability = function(name, success, failure)
{
    this.get(function(plugins){
        var result = [];
        for(var id in plugins)
        {
            var plugin = plugins[id];
            var matches = false;
            for(var capability_id in plugin.capabilities)
            {
                var capability = plugin.capabilities[capability_id];
                if(capability.name == name)
                    matches = true;
            }

            if(matches)
                result.push(plugin);
        }

        success(result);

    }, failure);
}

/**
 * Returns a list of MjsPlayer objects
 */
Players.prototype.getMjs = function(success, failure)
{
    this.getCapability("mjs", function(plugins)
            {
                var result = [];
                for(id in plugins)
                {
                    plugin = plugins[id];
                    result.push(new MjsPlayer(plugin));
                }
                success(result);
            }, failure);
}
/**
 * Represents a playlist
 * @constructor
 */
function Playlist(uri, data)
{
    /** The uri of the playlist */
    this.uri = uri;
    /** A list of PlaylistItem objects */
    this.items = [];
    /** The list of uids in this playlist */
    this.uids = [];
    /** Wether PlaylistItems should automatically fetch songdata */
    this.prefetch = false;

    for(var itemid in data.items)
    {
        var itemdata = data.items[itemid];
        var item = new PlaylistItem(itemdata);
        this.items.push(item);
        this.uids.push(item.uri);
    }

    /** An overridable function that gets called when a new PlaylistItem is added during an update */
    this.onAdd = function(playlistItem, index){};
}

/**
 * Parses a playlist from a given uri
 */
Playlist.fromUri = function(uri, success, failure, prefetch)
{
    if(prefetch == undefined)
        prefetch = false;

    MusicMaster.get(uri, function(request) {
        var playlist = new Playlist(uri, request.responseJson);

        if(!prefetch)
        {
            success(playlist);
            return;
        }

        playlist.prefetch = true;

        var left = 0;
        var errorResponse = undefined;

        var done = function()
        {
            left--;
            if(left > 0)
                return;

            if(errorResponse != undefined)
                failure(errorResponse);
            else
                success(playlist);
        }

        left = playlist.items.length;
        for(var i = 0; i < playlist.items.length; i++)
        {
            if(playlist.items[i].songUri !== undefined)
            {
                playlist.items[i].getSong(done, function(e) { errorResponse = e; done(); });
            }
            else
            {
                playlist.items[i].song = undefined;
                left--;
            }
        }

    }, failure);
}

/**
 * Appends a song to the playlist
 */
Playlist.prototype.append = function(song, success, failure)
{
    MusicMaster.post(this.uri, song, success, failure);
}

/**
 * Inserts a song before a specific PlaylistItem
 */
Playlist.prototype.insert = function(song, before, success, failure)
{
    MusicMaster.post(before.uri, song, success, failure);
}

/**
 * Clear playlist
 */
Playlist.prototype.clear = function(success, failure)
{
    MusicMaster.delete(this.uri, success, failure);
}

/**
 * Automatically updates the current playlist with the version on the remote player
 */
Playlist.prototype.update = function(success, failure)
{
    var orig = this;
    Playlist.fromUri(this.uri, function(newplaylist)
            {
                var removelist = [];
                var addlist = [];

                for(var i = 0; i < orig.uids.length; i++)
                    if(newplaylist.uids.indexOf(orig.uids[i]) == -1)
                        removelist.push(orig.uids[i]);

                for(var i = 0; i < newplaylist.uids.length; i++)
                    if(orig.uids.indexOf(newplaylist.uids[i]) == -1)
                        addlist.push(newplaylist.uids[i]);

                for(var i = 0; i < removelist.length; i++)
                {
                    var uri = removelist[i];
                    orig.uids.splice(orig.uids.indexOf(uri), 1);
                    for(var j = 0; j < orig.items.length; j++)
                        if(orig.items[j].uri == uri)
                        {
                            var item = orig.items[j];
                            orig.items.splice(j, 1);
                            item.onRemove(item, j);
                            break;
                        }
                }

                for(var i = 0; i < addlist.length; i++)
                {
                    var uri = addlist[i];
                    orig.uids.push(uri);
                    for(var j = 0; j < newplaylist.items.length; j++)
                        if(newplaylist.items[j].uri == uri)
                        {
                            var item = newplaylist.items[j];
                            orig.items.splice(j, 0, item);
                            orig.onAdd(item, j);
                        }
                }

                for(var i = 0; i < orig.items.length; i++)
                {
                    if(orig.items[i].uri == newplaylist.items[i].uri)
                        continue;

                    var item = orig.items[i];
                    for(var j = 0; j < newplaylist.items.length; j++)
                    {
                        if(item.uri != newplaylist.items[j].uri)
                            continue;

                        orig.items.splice(i, 1);
                        orig.items.splice(j, 0, item);
                        item.onMove(item, i, j);
                        i--;
                    }
                }

                success(orig);

            }, failure, this.prefetch);
}
/**
 * Represents a song in a playlist
 * @constructor
 */
function PlaylistItem(data)
{
    /** The uri of this object (also uid) */
    this.uri = data.url;
    /** The physical location of the song (may or may not be accessible from the web) */
    this.location = data.location;
    /** The uri of the song data */
    this.songUri = data.song;

    /** This overridable function gets called when this PlaylistItem is removed from a playlist */
    this.onRemove = function(playlistItem, index){};
    /** This overridable function gets called when this PlaylistItem moves within the playlist */
    this.onMove = function(playlistItem, oldindex, newindex){};
}

/**
 * Fetches the song corresponding to this PlaylistItem
 */
PlaylistItem.prototype.getSong = function(success, failure)
{
    if(this.song != undefined)
    {
        success(this.song);
        return;
    }

    var context = this;

    Song.fromUri(this.songUri, function(song)
            {
                context.song = song;
                success(song);
            }, failure);
}

PlaylistItem.prototype.remove = function(success, failure)
{
    MusicMaster.delete(this.uri, success, failure);
}
/**
 * Represents a song that can be played
 * @constructor
 */
function Song(uri, data)
{
    /** The uri of this song */
    this.uri = uri;

    /** Constant "song" */
    this.type = "song";

    /** The title of the song (can be unknown) */
    this.title = data.title;
    /** The artist of the song (can be unknown) */
    this.artist = data.artist;
    /** The physical location of the song */
    this.location = data.location;
    if(data.url != undefined)
        this.uri = data.url;
    if(data.length != undefined)
        this.length = data.length;
}

Song.cache = Array();

/**
 * Parses a song from a given uri
 */
Song.fromUri = function(uri, success, failure)
{
    if(Song.cache[uri] !== undefined)
    {
        success(Song.cache[uri]);
        return;
    }

    MusicMaster.get(uri, function(request)
            {
                var song = new Song(uri, request.responseJson);
                Song.cache[uri] = song;
                success(song);
            }, failure);
}
