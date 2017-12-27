const http = require('http');
const url = require('url');
const flvStreamManager = require('./flvStreamManager');
const douyu = require('./douyu');

// var flvFile = "1511362565.flv";
// if (process.argv.length > 2) {
//    flvFile = process.argv[2];
// }
// var fs = require('fs');
// var inStream = fs.createReadStream(flvFile);
// var fsm = new flvStreamManager.FlvStreamManager();
// fsm.track(inStream);

if (process.argv.length < 4) {
   console.error('argv should >= 4');
   return;
}
console.log(process.argv[2]);
console.log(process.argv[3]);
var sRoomId = process.argv[2];
var sToken = process.argv[3];

var fsm = new flvStreamManager.FlvStreamManager();
douyu.getPlay(sRoomId, sToken, (sOriginUrl) => {
   // getStream wrapper
   function getStream(sUrl) {
      var oReq = http.request(sUrl, (oRes) => {
         console.log(oRes.statusCode);
         if (oRes.statusCode === 200) {
            fsm.track(oRes);
            // oRes.on('data', function(chunk){
            //    console.log(chunk.length);
            // });
         } else if (oRes.statusCode === 302) {
            console.log('>> redirect to: ' + oRes.headers.location);
            getStream(oRes.headers.location);
         }
      });
      oReq.end();
   }
   getStream(sOriginUrl);
});

// douyu.getPlay(sRoomId, sToken, (sOriginUrl) => {
//    // onGetStream wrapper
//    var onGetStream = (oRes) => {
//       console.log(oRes.statusCode);
//       if (oRes.statusCode === 200) {
//          // fsm.track(oRes);
//          oRes.on('data', function(chunk){
//             console.log(chunk.length);
//          });
//       } else if (oRes.statusCode === 302) {
//          console.log('>> redirect to: ' + oRes.headers.location);
//          var oReq = http.request(oRes.headers.location, onGetStream);
//          oReq.end();
//       }
//    }

//    var oReq = http.request(sOriginUrl, onGetStream);
//    oReq.end();
// });



var server = http.createServer((req, res) => {
   res.setHeader('Content-Type', 'video/x-flv');
   res.setHeader('Transfer-Encoding', 'chunked');
   res.setHeader('Pragma', 'no-cache');
   res.setHeader('access-control-allow-origin', '*');
   res.setHeader('access-control-allow-credentials', 'true');
   res.setHeader('x-daa-tunnel', 'hop_count=1');

   var _aPool = [];
   var _bFulfilled = false;
   var fOnData = function(bfData) {
      // on data
      //console.log(bfData.length);
      if (_bFulfilled) {
         _aPool.push(bfData);
      } else {
         _bFulfilled = !res.write(bfData);
         if (_bFulfilled) console.log('buffer fulfilled!!!');
      }
   };
   var fOnEnd = function() {
      fsm.unsubscribe(fOnData, fOnEnd);
   };

   fsm.subscribe(fOnData, fOnEnd);
   res.on('drain', ()=>{
      console.log('buffer drained!!!');
      _bFulfilled = false;
      while (!_bFulfilled && _aPool.length > 0) {
         var bfData = _aPool.shift();
         _bFulfilled = !res.write(bfData);
         if (_bFulfilled) console.log('buffer fulfilled again !!!');
      }
   });

   res.on('end', ()=>{
      console.log('end');
      //fsm.unsubscribe(fOnData, fOnEnd);
   });
   res.on('close', ()=>{
      console.log('close');
      //fsm.unsubscribe(fOnData, fOnEnd);
   });
});

server.listen(8080);
console.log('listen on *:8080');
