
var https = require('https');
var fs = require('fs'); // Using the filesystem module

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
var express = require('express');
var app = express();

app.get('/', function(req, res) {
	res.send("Hello World!");
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

var httpsServer = https.createServer(credentials, app);

// Default HTTPS Port
httpsServer.listen(443);