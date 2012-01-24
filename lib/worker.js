var parser = require(__dirname + '/parser');


process.on('message', function(data) {
	var method = data.method;
	var file = data.file;
	var groups = data.groups;
	if (!method) throw new TypeError('Message does not contain method');
	if (!file) throw new TypeError('Message does not contain file');
	if (!parser.hasOwnProperty(method)) throw new ReferenceError('Method ' + method + ' is not valid');
	
	parser[method](file, groups, function(devices) {
		if (!devices) return;
		process.send({
			method: method,
			file: file,
			devices: devices
		});
	});
});
