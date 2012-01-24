var fs = require('fs');
var path = require('path');
var expat = require('node-expat');
var parser = require('./parser');
var backgrounder = require("backgrounder");


var wurflFile = path.join(__dirname, '../wurfl.xml');
var userAgents = {};
var worker;
var callbacks = {watch: {}, load: {}};


function get(userAgent) {
	return userAgents[userAgent];
}

function getAll() {
	return userAgents;
}

function close() {
	if (worker) worker.terminate();
}

// lazily load the worker
function getWorker() {
	if (!worker) {
		worker = new backgrounder.spawn(path.join(__dirname, './worker.js'));
		
		worker.on('message', function(data) {
			var method = data.method;
			var file = data.file;
			var devices = data.devices;
			packageDevices(devices);
			var callback = callbacks[method][file];
			if (callback) callback();
		});
		
		worker.on('error', function(error) {
			console.error(error);
		});
	}
	
	return worker;
}


function watch(options, callback) {
	if (typeof options === 'function') {
		callback = options;
		options = undefined;
	}
	if (typeof options === 'string') {
		options = { file: options };
	}
	options = options || { file: options };
	options.file = options.file || wurflFile;
	
	if (callback) callbacks.watch[file] = callback;
	
	getWorker().send({
		method: 'watch',
		file: options.file,
		groups: options.groups
	});
}


function load(options, callback) {
	if (typeof options === 'function') {
		callback = options;
		options = undefined;
	}
	if (typeof options === 'string') {
		options = { file: options };
	}
	options = options || { file: options };
	options.file = options.file || wurflFile;
	
	if (callback) callbacks.load[options.file] = callback;
	
	getWorker().send({
		method: 'load',
		file: options.file,
		groups: options.groups
	});
}


function loadSync(options) {
	if (typeof options === 'string') {
		options = { file: options };
	}
	options = options || { file: options };
	options.file = options.file || wurflFile;
	
	var contents = fs.readFileSync(options.file);
	packageDevices(parser.parse(contents, options.groups));
}


function packageDevices(devices) {
	var agents = {};
	
	// add the lookup first
	devices.forEach(function(device) {
		devices[device.id] = device;
	});
	
	// create device objects from each one
	devices.forEach(function(device, i, array) {
		if (device instanceof Device) return;
		array[i] = createDevice(device, devices, agents);
	});
	
	userAgents = agents;
}


function createDevice(attr, lookup, agents) {
	if (attr.fall_back !== 'root' && !(lookup[attr.fall_back] instanceof Device)) {
		createDevice(lookup[attr.fall_back], lookup, agents);
	}
	
	var groups = attr.groups;
	delete attr.groups;
	var device = new Device(attr);
	lookup[device.id] = device; // add a lookup by id
	agents[device.user_agent] = device; // and a lookup by user agent
	
	var parent = lookup[attr.fall_back];
	if (parent) {
		for (var i in parent) {
			var group = parent[i];
			if (group instanceof Group) {
				device[i] = group;
			}
		}
	}
	
	for (var id in groups) {
		group = device[id];
		var GroupClass = function() {};
		GroupClass.prototype = group ? new group.constructor() : new Group();
		var groupProto = GroupClass.prototype;
		groupProto.constructor = GroupClass;
		groupProto.id = device.id + '.' + id;
		device[id] = group = new GroupClass();
		
		var capabilities = groups[id];
		for (var name in capabilities) {
			groupProto[name] = capabilities[name];
		}
	}
	
	return device;
}


function Device(attr) {
	for (var i in attr)
		if (attr.hasOwnProperty(i)) this[i] = attr[i];
}

function Group() {}


exports.watch = watch;
exports.load = load;
exports.loadSync = loadSync;
exports.get = get;
exports.getAll = getAll;
exports.close = close;
