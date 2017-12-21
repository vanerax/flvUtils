const fs = require('fs');
const flvUtils = require('./flvUtils');
const assert = require('assert');

var flvFile = "frame5b.flv";

if (process.argv.length > 2) {
   flvFile = process.argv[2];
}

var inStream = fs.createReadStream(flvFile);
var nTagOffset = 0;
var nTagIndex = 0;

flvUtils.parseStream(inStream, {
   onGetHeader: function(bfHeader, oMetadata) {
      assert.equal("FLV", oMetadata.type.toString());
      assert.equal(1, oMetadata.version);
      assert.equal(5, oMetadata.streamInfo);
      assert.equal(9, oMetadata.headerLength);
      nTagOffset += oMetadata.headerLength;
   },
   onGetTag: function(bfTag, oMetadata) {
      if (nTagIndex === 0) {
         assert.equal(0, oMetadata.prevTagSize);
         assert.equal(18, oMetadata.tagType);
         assert.equal(0x0146, oMetadata.dataLength);
         assert.equal(0, oMetadata.timestamp);
         assert.equal(0, oMetadata.timestampExt);
         assert.equal(0, oMetadata.streamsID);

      } else if (nTagIndex === 1) {
         assert.equal(0x0151, oMetadata.prevTagSize);
         assert.equal(9, oMetadata.tagType); // video
         assert.equal(0x2d, oMetadata.dataLength);
         assert.equal(0, oMetadata.timestamp);
         assert.equal(0, oMetadata.timestampExt);
         assert.equal(0, oMetadata.streamsID);
         assert.equal(1, oMetadata.dataInfo.videoType); // key frame
         assert.equal(7, oMetadata.dataInfo.videoEncoder); // AVC
         
      } else if (nTagIndex === 2) {
         assert.equal(0x38, oMetadata.prevTagSize);
         assert.equal(8, oMetadata.tagType); // audio
         assert.equal(0x04, oMetadata.dataLength);
         assert.equal(0, oMetadata.timestamp);
         assert.equal(0, oMetadata.timestampExt);
         assert.equal(0, oMetadata.streamsID);
         assert.equal(10, oMetadata.dataInfo.audioFormat);
         assert.equal(3, oMetadata.dataInfo.audioSampling);
         assert.equal(1, oMetadata.dataInfo.audioSamplingLen);
         assert.equal(1, oMetadata.dataInfo.audioType);

      } else if (nTagIndex === 3) {
         assert.equal(0x0f, oMetadata.prevTagSize);
         assert.equal(9, oMetadata.tagType); // video @ 0x1b1
         assert.equal(0x187db, oMetadata.dataLength);
         assert.equal(0, oMetadata.timestamp);
         assert.equal(0, oMetadata.timestampExt);
         assert.equal(0, oMetadata.streamsID);
         assert.equal(1, oMetadata.dataInfo.videoType); // key frame
         assert.equal(7, oMetadata.dataInfo.videoEncoder); // AVC
      } else if (nTagIndex === 4) {
         assert.equal(0x0187e6, oMetadata.prevTagSize);
         assert.equal(8, oMetadata.tagType); // audio @ 0x1899b
         assert.equal(0x0179, oMetadata.dataLength);
         assert.equal(0x13, oMetadata.timestamp);
         assert.equal(0, oMetadata.timestampExt);
         assert.equal(0, oMetadata.streamsID);
         assert.equal(10, oMetadata.dataInfo.audioFormat);
         assert.equal(3, oMetadata.dataInfo.audioSampling);
         assert.equal(1, oMetadata.dataInfo.audioSamplingLen);
         assert.equal(1, oMetadata.dataInfo.audioType);

      }
      console.log(`${nTagIndex} ${oMetadata.tagType} 0x${(nTagOffset+4).toString(16)} `);
      //console.log("\b\b " + oMetadata.tagType);

      nTagIndex++;
      nTagOffset += 4 + 0xb + oMetadata.dataLength;

   },
   onGetLastTagSize: function() {

   }
});
