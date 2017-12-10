const fs = require('fs');
const flvUtils = require('./flvUtils');

if (process.argv.length < 3) {
   console.log('arguments should not < 3');
   return;
}
var file = process.argv[2];
console.log(process.argv);
var inStream = fs.createReadStream(file);
var outStream = fs.createWriteStream('output.flv');

var bfHeader;
var bfFirstTag;
var nTagIndex = 0;

var onGetHeader = (bfData) => {
   console.log(bfData.length);
   bfHeader = bfData;
   outStream.write(bfHeader);
};
var onGetTag = (bfData) => {
   console.log(bfData.length);
   if (nTagIndex == 0) {
      bfFirstTag = bfData;
      outStream.write(bfData);
   } else if (nTagIndex < 5) {
      outStream.write(bfData);
   }
   if (nTagIndex == 5) {
      outStream.write(bfData.slice(0, 4));
   }

   nTagIndex++;
};

var onGetLastTagSize = (bfData) => {
   console.log(bfData.length);
   //outStream.write(bfData);
   outStream.end();
};

flvUtils.parseStream(inStream, {
   onGetHeader: onGetHeader,
   onGetTag: onGetTag,
   onGetLastTagSize: onGetLastTagSize
});
