const fs = require('fs');
const flvUtils = require('./flvUtils');

if (process.argv.length < 3) {
   console.log('arguments should not < 3');
   return;
}
var file = process.argv[2];
console.log(process.argv);
var inStream = fs.createReadStream(file);

var onGetHeader = (bfData) => {
   console.log(bfData.length);
};
var onGetTag = (bfData) => {
   console.log(bfData.length);
};

var onGetLastTagSize = (bfData) => {
   console.log(bfData.length);
};

flvUtils.parseStream(inStream, {
   onGetHeader: onGetHeader,
   onGetTag: onGetTag,
   onGetLastTagSize: onGetLastTagSize
});
