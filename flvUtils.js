const assert = require('assert');

const PREV_TAG_SIZE = 4;
const TAG_HEADER_SIZE = 11;

function flvUtils() {

}

flvUtils.parseStream = function(inStream, options) {
   var arrBuffer = [];
   var nStreamIndex = 0;
   var nTagIndex = 0;

   var fOnGetHeader = options.onGetHeader;
   var fOnGetTag = options.onGetTag;
   var fOnGetLastTagSize = options.onGetLastTagSize;

   function parseHeader() {
      inStream.once('data', (chunk) => {
         assert.ok(chunk.length >= 9);

         var type = chunk.slice(0, 3).toString();
         assert.equal('FLV', type);

         var headerLength = chunk.readInt32BE(0x05);
         var bfHeader = chunk.slice(0, headerLength);
         nStreamIndex += headerLength;
         if (fOnGetHeader) {
            fOnGetHeader(bfHeader);
         }
         // add rest part to buffer
         arrBuffer.push(chunk.slice(0 + headerLength));
         
         parseBody();
      });
   }

   function parseBody() {
      //console.log('>> parseBody');
      inStream.on('data', (chunk) => {
         arrBuffer.push(chunk);
         parseBodyByBuffer();
      });
      inStream.on('end', () => {
         //parseBodyByBuffer();
         
         if (arrBuffer.length === 1 && arrBuffer[0].length === PREV_TAG_SIZE) {
            if (fOnGetLastTagSize) {
               fOnGetLastTagSize(arrBuffer[0]);
            }
            arrBuffer = [];
            nStreamIndex += 4;

            // end
            console.log('stream size ', nStreamIndex);
            console.log('tag size: ', nTagIndex);

         } else {
            console.log('stream truncated');
         }
         
      });

      parseBodyByBuffer();
   }

   function parseBodyByBuffer() {
      //console.log('>> parseBodyByBuffer');
      var bfAll = Buffer.concat(arrBuffer);
      while (bfAll.length >= PREV_TAG_SIZE + TAG_HEADER_SIZE) {
         // tag head available
         var dataLenth = bfAll.readUIntBE(PREV_TAG_SIZE + 1, 3);
         //console.log('>> ', dataLenth);
         if (bfAll.length >= PREV_TAG_SIZE + TAG_HEADER_SIZE + dataLenth) {
            var bfTag = bfAll.slice(0, PREV_TAG_SIZE + TAG_HEADER_SIZE + dataLenth);
            if (fOnGetTag) {
               fOnGetTag(bfTag);
            }
            nTagIndex++;

            bfAll = bfAll.slice(PREV_TAG_SIZE + TAG_HEADER_SIZE + dataLenth);
            nStreamIndex += PREV_TAG_SIZE + TAG_HEADER_SIZE + dataLenth;
         } else {
            break;
         }
      }
      arrBuffer = [ bfAll ];
   }

   parseHeader();
}

module.exports = flvUtils;
