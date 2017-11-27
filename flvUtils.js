const assert = require('assert');

function flvUtils() {

}

flvUtils.parseStream = function(inStream, options) {
   var arrBuffer = [];

   var fOnGetHeader = options.onGetHeader;

   function parseHeader() {
      inStream.once('data', (chunk) => {
         assert.ok(chunk.length >= 9);

         var type = chunk.slice(0, 3).toString();
         assert.equal('FLV', type);

         var headerLength = chunk.readInt32BE(0x05);

         if (fOnGetHeader) {
            fOnGetHeader(chunk.slice(0, headerLength));
         }
         parseBody();
      });
      // inStream.on('end', () => {

      // });
   }

   function parseBody(inStream, fOnGetTag) {

   }
}




module.exports = flvUtils;