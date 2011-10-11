var fs = require('fs');
var path = require('path');
var expat = require('node-expat');


function watch(file, groups, callback) {
	if (typeof options === 'function') {
		callback = options;
		options = {};
	}
	options = options || {};
	
	fs.watchFile(file, options, function(curr, prev) {
		if (curr.mtime === prev.mtime) return;
		load(file, groups, callback);
	});
}


function load(file, groups, callback) {
	if (typeof file === 'function') {
		callback = file;
		file = null;
	}
	
	fs.readFile(file, function(err, contents) {
		if (err) return console.error('Could not load wurfl.xml file:', err);
		var devices = parse(contents, groups);
		if (callback) callback(devices);
	});
}


function parse(contents, groups) {
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
			// if groups is provided, don't parse groups not in the array
			if (groups && groups.indexOf(attr.id) === -1) {
				group = null;
			} else {
				device.groups[attr.id] = group = {};
			}
		} else if (name === 'capability' && group) {
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
