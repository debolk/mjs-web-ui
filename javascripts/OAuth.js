/**
 * Setup the OAuth class
 * @constructor
 * @param {String} endpoint      the URL for the authorization server (no closing slash)
 * @param {String} client_id     oauth client_id
 * @param {String} client_secret oauth client_secret or client_pass
 * @param {String} redirect_uri  oauth callback URL
 * @param {String} resource      the resource to authorize
 */
function OAuth(endpoint, client_id, client_secret, redirect_uri, resource)
{
    this.endpoint = endpoint;
    this.client_id = client_id;
    this.client_secret = client_secret;
    this.redirect_uri = redirect_uri;
    this.resource = resource;
}

/**
 * The main OAuth class
 * @class
 */
OAuth.prototype = {

    /**
     * Authenticates the user at the OAuth server and authorizes its use of the resource
     * might stop processsing by redirection (for logging in)
     * @return {Promise} resolves when authorized, rejects otherwise
     */
    check: function() {

        var promise = new Promise(function(resolve, reject){

            // Decode URL parameter
            var authorization_token = decodeURI((RegExp('code=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]);
            if (authorization_token == 'null') { // Correct
                // Not authenticated, must login (this redirects the page)
                window.location = this.endpoint + '/authorize?response_type=code'
                                    + '&client_id=' + this.client_id + '&client_pass=' + this.client_secret
                                    + '&redirect_uri=' + this.redirect_uri + '&state=1';
                reject('login_redirection');
                return;
            }

            // Call the authorization endpoint over AJAX
            var request = new XMLHttpRequest();
            request.open('POST', this.endpoint + '/token', true);
            request.responseType = 'json';
            request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
            var data = {
                grant_type: 'authorization_code',
                code: authorization_token,
                redirect_uri: this.redirect_uri,
                client_id: this.client_id,
                client_secret: this.client_secret,
            }

            request.onload = function() {
              if (this.status >= 200 && this.status < 400) {
                resolve(this.response.access_token);
              }
              else {
                reject(this.response);
              }
            };

            request.onerror = function() {
                reject(this);
            };

            request.send(JSON.stringify(data));
        }.bind(this));

        return promise;
    }
};
