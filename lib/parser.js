var fs = require('fs');
var path = require('path');
var expat = require('node-expat');


function watch(file, options, callback) {
	if (typeof options === 'function') {
		callback = options;
		options = {};
	}
	options = options || {};
	
	fs.watchFile(file, options, function(curr, prev) {
		if (curr.mtime === prev.mtime) return;
		load(file, callback);
	});
}


function load(file, callback) {
	if (typeof file === 'function') {
		callback = file;
		file = null;
	}
	
	fs.readFile(file, function(err, contents) {
		if (err) return console.error('Could not load wurfl.xml file:', err);
		var devices = parse(contents);
		if (callback) callback(devices);
	});
}


function parse(contents) {
	var parser = new expat.Parser();
	
	var devices = [];
	var device;
	var group;
	
	parser.on('startElement', function(name, attr) {
		
		if (name === 'device') {
			device = attr;
			device.groups = {};
			devices.push(device);
		} else if (name === 'group') {
			device.groups[attr.id] = group = {};
		} else if (name === 'capability') {
			var value = attr.value;
			if (parseFloat(value).toString() === value) {
				value = parseFloat(value);
			} else if (value === 'false') {
				value = false;
			} else if (value === 'true') {
				value = true;
			}
			group[attr.name] = value;
		}
	});
	
	parser.parse(contents);
	return devices;
}

exports.watch = watch;
exports.load = load;
exports.parse = parse;
