wurfl.js
========

wurfl.js is a node.js library to make it easy to use wurfl. What is wurfl? From the site http://wurfl.sourceforge.net/:

```
WURFL is a Device Description Repository (DDR), i.e. a software
component which contains the descriptions of thousands of mobile
devices. In its simplest incarnation, WURFL is an XML
configuration file plus a set of programming APIs to access the
data in real-time environments.
```

Usage
-----

### Installation

Install node.js (http://nodejs.org) first, then npm (http://npmjs.org), then:

```bash
npm install wurfl
```

### Usage

Basic usage allows getting up and running quickly.

```javascript
var wurfl = require('wurfl');

wurfl.loadSync();

// wurfl xml file is finished loading into a memory-efficient structure

var userAgent = 'Mozilla/4.0 (compatible; MSIE 4.01; Windows CE; O2 Xda 2s;PPC;240x320; PPC; 240x320)';
var deviceInfo = wurfl.get(userAgent);
console.log(deviceInfo.model_name); // "Xda IIs"
```

You may want to use your own (read "updated") wurfl.xml file. This is easy:

```javascript
var wurflFile = __dirname + '/wurfl.xml';
wurfl.loadSync(wurflFile);
```

Loading and parsing a large xml file can be take awhile and be CPU-heavy. You may use load() to asynchronously load the xml file:

```javascript
wurfl.load(function() {
	// ready to use, wurfl.get(userAgent);
});
```

Or with your own xml file:

```javascript
wurfl.load(myWurflFile, function() {
	// my own file
});
```

When using your own file, it would be great to update the file without needing to restart the node.js server:

```javascript
wurfl.watch(myWurflFile);
```

When updating using watch it will always be asynchronous. The data structure will be updated automatically when the file is changed. You may also be notified when that happens if you want to know when it gets updated:

```javascript
wurfl.watch(myWurflFile, function() {
	console.log('XML file updated');
});
```

If you want to reduce memory usage even further, you can specify the the groups you are interested in, the rest will be left out completely. For example, if you only care about the "display" capabilities:

```javascript
wurfl.loadSync({ groups: [ 'display' ] });
```

When specifying groups the "file" parameter needs to be an options hash with `groups` and optionally `file`. You can use this in loadSync(options), load(options, callback), and watch(options, callback).

```javascript
var options = { file: __dirname + '/wurfl.xml', groups: [ 'display' ] };
wurfl.loadSync(options);
wurfl.watch(options);
```

The most common use-case is to load the file up when your script starts synchronously since you need it to exist before you start querying against it, but then add a watch to asynchronously update it later:

```javascript
var wurfl = require('wurfl');
var wurflFile = __dirname + '/wurfl.xml';

wurfl.loadSync(wurflFile);
wurfl.watch(myWurflFile);

var userAgent = 'Mozilla/4.0 (compatible; MSIE 4.01; Windows CE; O2 Xda 2s;PPC;240x320; PPC; 240x320)';
var deviceInfo = wurfl.get(userAgent);
console.log(deviceInfo.model_name); // "Xda IIs"
```

That's all for the API:

*  wurfl.loadSync(optFileName)
*  wurfl.load(optFileName, optCallback)
*  wurfl.watch(optFileName, optCallback)
*  wurfl.get(userAgent)

To see what properties are available in the info object you get back from wurfl.get() look at the wurfl.xml file. Each group is an object on info (e.g. info.css is a group) and each capability is a property on the group (e.g. info.css.css_spriting is a capability).

### Optimizations

The devices in the wurfl.xml file "inherit" from other devices, specified in the XML by the fall_back attribute. In order to optimize for memory and not duplicate the base properties over and over again for every single device, I've structured the groups to have their own class that extends the fall_back group class. I've set all the capabilites for a group on its prototype object. And for groups that weren't overridden, the device just points to its fall_back device's group. This way, when you access a group's capability it will pull it from the group's prototype object or from further up the prototype chain back to the top-level group instance.

In addition to optimizing for memory I've also added a worker using node-webworkers to load and parse the XML file in a separate process from the main script. This allows the wurfl data to be loaded and/or updated without blocking a large chunk of time from your main script. This can be up to several seconds to load and parse the XML file. The worker is lazily created however, so if you only use loadSync() and get() it won't create the worker.
