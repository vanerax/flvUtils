const assert = require('assert');

const PREV_TAG_SIZE = 4;
const TAG_HEADER_SIZE = 11;

function flvUtils() {

}

flvUtils.parseStream = function(inStream, options) {
   var arrBuffer = [];
   var nStreamOffset = 0;
   var nTagIndex = 0;
   var nPrevTagIndex = -1;

   var fOnGetHeader = options.onGetHeader;
   var fOnGetTag = options.onGetTag;
   var fOnGetPrevTagSize = options.onGetPrevTagSize;
   var fOnEnd = options.onEnd;

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
         nStreamOffset += oMetadata.headerLength;
         
         if (fOnGetHeader) {
            fOnGetHeader(bfHeader, oMetadata);
         }
         // add rest part to buffer
         arrBuffer.push(chunk.slice(0 + oMetadata.headerLength));
         
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
         
         if (arrBuffer.length === 1 && arrBuffer[0].length === 0) {
            if (fOnEnd) {
               fOnEnd();
            }

            // end
            console.log('stream size ', nStreamOffset);
            console.log('tag size: ', nTagIndex);
            console.log('prev tag size: ', nPrevTagIndex);

         } else {
            console.log('stream truncated');
         }
         
      });

      parseBodyByBuffer();
   }

   function parseBodyByBuffer() {
      //console.log('>> parseBodyByBuffer');

      var bfAll = Buffer.concat(arrBuffer);
      if (nPrevTagIndex === -1) {
         if (bfAll.length >= PREV_TAG_SIZE) {
            if (fOnGetPrevTagSize) {
               var bfPrevTagSize = bfAll.slice(0, PREV_TAG_SIZE);
               fOnGetPrevTagSize(bfPrevTagSize, bfPrevTagSize.readUInt32BE(), nPrevTagIndex);
            }
            bfAll = bfAll.slice(PREV_TAG_SIZE);
            nPrevTagIndex++;
         } else {
            arrBuffer = [ bfAll ];
            return;
         }
      }

      while (bfAll.length >= TAG_HEADER_SIZE) {
         // tag head available
         var dataLenth = bfAll.readUIntBE(1, 3);
         //console.log('>> ', dataLenth);
         if (bfAll.length >= TAG_HEADER_SIZE + dataLenth + PREV_TAG_SIZE) {
            var bfTag = bfAll.slice(0, TAG_HEADER_SIZE + dataLenth);

            // fill metadata
            var oMetadata = {
               //prevTagSize: bfTag.readUInt32BE(),
               tagType: bfTag.readUInt8(0),
               dataLength: dataLenth,
               timestamp: bfTag.readUIntBE(4, 3),
               timestampExt: bfTag.readUIntBE(7, 1),
               streamsID: bfTag.readUIntBE(8, 3),
               data: bfTag.slice(TAG_HEADER_SIZE, TAG_HEADER_SIZE + dataLenth),
               dataInfo: {}
            };

            var oDataInfo = oMetadata.dataInfo;
            switch (oMetadata.tagType) {
               case 8:
                  // audio
                  var audioInfo = oMetadata.data.readUInt8();
                  oDataInfo.audioFormat = audioInfo >> 4;
                  oDataInfo.audioSampling = (audioInfo & 0xf) >> 2;
                  oDataInfo.audioSamplingLen = (audioInfo & 0x3) >> 1;
                  oDataInfo.audioType = (audioInfo & 0x1);
                  break;

               case 9:
                  // video
                  var videoInfo = oMetadata.data.readUInt8();
                  oDataInfo.videoType = videoInfo >> 4;
                  oDataInfo.videoEncoder = videoInfo & 0xf;
                  break;

               case 18:
                  // script
                  // TODO - need investigation
                  break;
            }

            if (fOnGetTag) {
               fOnGetTag(bfTag, oMetadata);
            }
            nTagIndex++;

            if (fOnGetPrevTagSize) {
               var bfPrevTagSize = bfAll.slice(TAG_HEADER_SIZE + dataLenth, TAG_HEADER_SIZE + dataLenth + PREV_TAG_SIZE);
               fOnGetPrevTagSize(bfPrevTagSize, bfPrevTagSize.readUInt32BE(), nPrevTagIndex);
            }
            nPrevTagIndex++;

            bfAll = bfAll.slice(TAG_HEADER_SIZE + dataLenth + PREV_TAG_SIZE);
            nStreamOffset += TAG_HEADER_SIZE + dataLenth + PREV_TAG_SIZE;
         } else {
            break;
         }
      }
      arrBuffer = [ bfAll ];
   }

   parseHeader();
}

module.exports = flvUtils;
