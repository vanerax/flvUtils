var http = require('http');
var url = require('url');
const douyu = require('./douyu');
const fs = require('fs');

//var oOptions = url.parse('http://www.baidu.com/');
var oOptions = url.parse('http://localhost:8080/');
var req = http.request(oOptions, (res)=> {
   let rawData = '';
   console.log(res.headers);
   var os = fs.createWriteStream('r:\\zzz.flv');
   res.on('data', (chunk) => {
      //rawData += chunk;
      //console.log(chunk.length);
      os.write(chunk);
      //res.socket.destroy();
   });
   res.on('end', () => {
      console.log('end');
      os.end();
   });
   res.on('close', () => {
      console.log('close');
   });
});
req.end();
req.on('error', (err) => {
   console.error(err);
});

// var sRoomId = '255865';
// var sToken = 'ver=2017120901&tt=25215265&sign=3cde4e421aea535301f0c67a11c03a83&cdn=tct&rate=2&did=2d1149d79179e4c521e1407370061501&cptl=0002';
// douyu.getPlay(sRoomId, sToken, (sOriginUrl) => {
//    // getStream wrapper
//    function getStream(sUrl) {
//       var oReq = http.request(sUrl, (oRes) => {
//          console.log(oRes.statusCode);
//          if (oRes.statusCode === 200) {
//             console.log(oRes.headers);
//             // oRes.on('data', function(chunk){
//             //    console.log(chunk.length);
//             // });
//             var os = fs.createWriteStream('r:\\zzz.flv');
//             oRes.pipe(os);

//          } else if (oRes.statusCode === 302) {
//             console.log('>> redirect to: ' + oRes.headers.location);
//             getStream(oRes.headers.location);
//             var os = fs.createWriteStream('r:\\flv.txt');
//             os.write(oRes.headers.location);
//             os.end();
//          }
//       });
//       oReq.end();
//    }
//    getStream(sOriginUrl);
// });