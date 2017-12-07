var http = require('http');
var url = require('url');

var oOptions = url.parse('http://www.baidu.com/');
console.log(oOptions);

var req = http.request(oOptions, (res)=> {
   res.setEncoding('utf8');
   let rawData = '';
   res.once('data', (chunk) => {
      rawData += chunk;

      console.log(rawData);
      //res.socket.destroy();
   });
   res.on('end', () => {
      console.log('rawData');
   });


});
req.end();
