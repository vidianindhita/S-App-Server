
var https = require('https');
var fs = require('fs'); // Using the filesystem module
const express = require('express'); // Express web server framework
const request = require('request'); // "Request" library
const cors = require('cors');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');

const client_id = 'bd342b1ed1c541898915df8a22de7d62'; // Your client id
const client_secret = '919b552dd3d04df79893cb0e3419a8b0'; // Your secret
const redirect_uri = 'https://staging.vidia.site/callback'; // Your redirect uri
const SpotifyWebApi = require('spotify-web-api-node');

let access_token; // probably should not global

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
const generateRandomString = (length) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const stateKey = 'spotify_auth_state';

var credentials = {
  key: fs.readFileSync('/etc/letsencrypt/live/staging.vidia.site/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/staging.vidia.site/cert.pem')
};

var device_1 = {
	status: false,
	message: false
};

var device_2 = {
	status: false
};

var device_3 = {
	status: false
};

// Start Normal Express Code
// var express = require('express');
var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

// app.get('/', function(req, res) {
// 	res.send("Hello World!");
// });

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  const scope = 'user-read-private user-read-email user-read-playback-state';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', (req, res) => {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

            access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

app.get('/obtain_song_info', (req, res) => {
  console.log("get song info");
  // get token
  const spotifyApi = new SpotifyWebApi({
    clientId: client_id,
    clientSecret: client_secret
  });
  console.log(access_token);
  spotifyApi.setAccessToken(access_token);

  // get current play song
  spotifyApi.getMyCurrentPlaybackState({})
    .then((data) => {
      // Output items
      // console.log(data.body);
      const songId = data.body.item.id;
      const songTitle = data.body.item.name;

      // song info
      console.log(`song id: ${songId}`);
      console.log(`song title: ${songTitle}`);

      // get audio feature
      spotifyApi.getAudioFeaturesForTrack(songId)
        .then(function (data) {
          console.log(data.body);
          // send back data to frontend
          res.send({
            'songTitle': songTitle,
            'songId': songId,
            'songFeatures': data.body
          });

        }, function (err) {
          done(err);
        });
    }, (err) => {
      console.log(`Something went wrong! ${err}`);
    });
});

app.get('/device-1', function(req, res) {
	res.send(device_1);
});

app.get('/device-2', function(req, res) {
	res.send(device_2);
});

app.get('/device-3', function(req, res) {
	res.send(device_3);
});

app.put('/device-1/on', function(req, res) {
	device_1 = {
		status: true,
		message: false
	}
	res.send(device_1);
});

app.put('/device-1/off', function(req, res) {
	device_1 = {
		status: false,
		message: false
	}
	res.send(device_1);
});

app.put('/device-1/message', function(req, res) {
	device_1 = {
		status: true,
		message: true
	}
	res.send(device_1);
});

app.put('/device-1/message-off', function(req, res) {
	device_1 = {
		status: true,
		message: false
	}
	res.send(device_1);
});

app.put('/device-2/on', function(req, res) {
	device_2 = {
		status: true
	}
	res.send(device_2);
});

app.put('/device-2/off', function(req, res) {
	device_2 = {
		status: false
	}
	res.send(device_2);
});

app.put('/device-3/on', function(req, res) {
	device_3 = {
		status: true
	}
	res.send(device_3);
});

app.put('/device-3/off', function(req, res) {
	device_3 = {
		status: false
	}
	res.send(device_3);
});

app.post('/device-1/on', function(req, res) {
	device_1 = {
		status: true,
		message: false
	}
	res.send(device_1);
});

app.post('/device-1/off', function(req, res) {
	device_1 = {
		status: false,
		message: false
	}
	res.send(device_1);
});

app.post('/device-1/message', function(req, res) {
	device_1 = {
		status: true,
		message: true
	}
	res.send(device_1);
});

app.post('/device-1/message-off', function(req, res) {
	device_1 = {
		status: true,
		message: false
	}
	res.send(device_1);
});

app.post('/device-2/on', function(req, res) {
	device_2 = {
		status: true
	}
	res.send(device_2);
});

app.post('/device-2/off', function(req, res) {
	device_2 = {
		status: false
	}
	res.send(device_2);
});

app.post('/device-3/on', function(req, res) {
	device_3 = {
		status: true
	}
	res.send(device_3);
});

app.post('/device-3/off', function(req, res) {
	device_3 = {
		status: false
	}
	res.send(device_3);
});

var httpsServer = https.createServer(credentials, app);

// Default HTTPS Port
httpsServer.listen(443);