var wurfl = require('../lib/wurfl');

console.log('Loading and parsing wurfl.xml');
wurfl.loadSync();

sanityCheck();

console.log('Everything looks good for synchronous loading');


console.log('Loading via worker');
wurfl.load(function() {
	sanityCheck();
	
	console.log('Everything looks good for asynchronous loading too');
	
	wurfl.close();
});


// super simple testing just for sanity check
function sanityCheck() {
	var info = wurfl.get('Mozilla/4.0 (compatible; MSIE 4.01; Windows CE; O2 Xda 2s;PPC;240x320; PPC; 240x320)');
	
	if (!info) {
		throw new Error('Loading by user agent not working');
	}
	
	if (info.playback.playback_mp4 !== true) {
		throw new Error('Specific info not working');
	}
	
	if (info.product_info.pointing_method !== 'stylus') {
		throw new Error('Inherited info not working');
	}
}