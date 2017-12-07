const http = require('http');
const url = require('url');
const flvStreamManager = require('./flvStreamManager');
const douyu = require('./douyu');

if (process.argv.length < 4) {
   console.error('argv should >= 4');
   return;
}
console.log(process.argv[2]);
console.log(process.argv[3]);

var fsm = new flvStreamManager.FlvStreamManager();
douyu.getPlay(process.argv[2], process.argv[3], (sUrl) => {
   var oUrl = url.parse(sUrl);
   var oReq = http.request(oUrl, (oRes) => {
      fsm.track(oRes);
   });
   oReq.end();
});

var server = http.createServer((req, res) => {
   fsm.subscribe((bfData) => {
      res.write(bfData);
   });
   //res.setHeader('Content-Type', 'flv');
});

server.listen(8080);



