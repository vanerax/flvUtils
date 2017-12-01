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

         // fill metadata
         var oMetadata = {
            type: chunk.slice(0, 3),
            version: chunk.readUInt8(0x03),
            streamInfo: chunk.readUInt8(0x04),
            headerLength: chunk.readUInt32BE(0x05)
         };

         assert.equal('FLV', oMetadata.type.toString());
         
         var bfHeader = chunk.slice(0, oMetadata.headerLength);
         nStreamIndex += oMetadata.headerLength;
         
         if (fOnGetHeader) {
            fOnGetHeader(bfHeader);
         }
         // add rest part to buffer
         arrBuffer.push(chunk.slice(0 + headerLength));
         
         parseBody();
      });
   }

   function parseBody() {
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

            // fill metadata
            var oMetadata = {
               prevTagSize: bfTag.readUInt32BE(),
               tagType: bfTag.readUInt8(PREV_TAG_SIZE),
               dataLength: dataLenth,
               timestamp: bfTag.readUIntBE(PREV_TAG_SIZE + 4, 3),
               timestampExt: bfTag.readUIntBE(PREV_TAG_SIZE + 7, 1),
               streamsID: bfTag.readUIntBE(PREV_TAG_SIZE + 8, 3),
               data: bfTag.slice(PREV_TAG_SIZE + 11, PREV_TAG_SIZE + TAG_HEADER_SIZE + dataLenth)
            };

            if (fOnGetTag) {
               fOnGetTag(bfTag, oMetadata);
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
