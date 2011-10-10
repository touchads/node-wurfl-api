var parser = require(__dirname + '/parser');


onmessage = function(event) {
	var data = event.data;
	var method = data.method;
	var file = data.file;
	if (!method) throw new TypeError('Message does not contain method');
	if (!file) throw new TypeError('Message does not contain file');
	if (!parser.hasOwnProperty(method)) throw new ReferenceError('Method ' + method + ' is not valid');
	
	parser[method](file, function(devices) {
		if (!devices) return;
		postMessage({
			method: method,
			file: file,
			devices: devices
		});
	});
};
