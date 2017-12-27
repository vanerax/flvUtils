const fs = require('fs');
const flvStreamManager = require('./flvStreamManager');

var flvFile = "1511362565.flv";
if (process.argv.length > 2) {
   flvFile = process.argv[2];
}

var inStream = fs.createReadStream(flvFile);
var fsm = new flvStreamManager.FlvStreamManager();
fsm.track(inStream);