const fs = require('fs');
const assert = require('assert');
const Readable = require('stream').Readable;
const flvStreamManager = require('./flvStreamManager');
const flvUtils = require('./flvUtils');

var flvFile = "1511362565.flv";
if (process.argv.length > 2) {
   flvFile = process.argv[2];
}

var inStream = fs.createReadStream(flvFile);
var fsm = new flvStreamManager.FlvStreamManager();
fsm.track(inStream);
inStream.on('end', runTest);


function onData(bfData, oMetadata) {
   flvStream.push(bfData);
}

function onEnd() {
   flvStream.push(null);
}

class FlvStream extends Readable {
   constructor(options) {
      super(options);

   }

   _read() {

   }
}
var flvStream = new FlvStream();

function runTest() {
   fsm.subscribe(onData, onEnd);

   var nTagIndex = 0;
   var nPrevTagIndex = -1;
   var nTagOffset = 0;

   var output = 'output.flv';
   var ws = fs.createWriteStream(output);
   flvStream.pipe(ws);
   // flvStream.on('data', (bfData) => {
   //    console.log(bfData);
   // });

   flvUtils.parseStream(flvStream, {
      onGetHeader: function(bfHeader, oMetadata) {
         assert.equal("FLV", oMetadata.type.toString());
         assert.equal(1, oMetadata.version);
         assert.equal(5, oMetadata.streamInfo);
         assert.equal(9, oMetadata.headerLength);
         nTagOffset += oMetadata.headerLength;
      },
      onGetTag: function(bfTag, oMetadata) {
         if (nTagIndex === 0) {
            assert.equal(18, oMetadata.tagType);
            assert.equal(0x0146, oMetadata.dataLength);
            assert.equal(0, oMetadata.timestamp);
            assert.equal(0, oMetadata.timestampExt);
            assert.equal(0, oMetadata.streamsID);

         } else if (nTagIndex === 1) {
            assert.equal(9, oMetadata.tagType); // video
            assert.equal(0x2d, oMetadata.dataLength);
            assert.equal(0, oMetadata.timestamp);
            assert.equal(0, oMetadata.timestampExt);
            assert.equal(0, oMetadata.streamsID);
            assert.equal(1, oMetadata.dataInfo.videoType); // key frame
            assert.equal(7, oMetadata.dataInfo.videoEncoder); // AVC
            
         } else if (nTagIndex === 2) {
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
            assert.equal(9, oMetadata.tagType); // video offset = 0x17B92C (1511362565.flv) <= last 10 key frame offset
            assert.equal(0x18fc3, oMetadata.dataLength);
            assert.equal(0x2ee0, oMetadata.timestamp);
            assert.equal(0, oMetadata.timestampExt);
            assert.equal(0, oMetadata.streamsID);
            assert.equal(1, oMetadata.dataInfo.videoType); // key frame
            assert.equal(7, oMetadata.dataInfo.videoEncoder); // AVC
         } else if (nTagIndex === 4) {
            assert.equal(8, oMetadata.tagType); // audio offset = 0x1948fe (1511362565.flv)
            assert.equal(0x18d, oMetadata.dataLength);
            assert.equal(0x2ee0, oMetadata.timestamp);
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
      onGetPrevTagSize: function(bfPrevTagSize, nPrevTagSize, nPrevTagIndex) {
         if (nPrevTagIndex === -1) {
            assert.equal(0, nPrevTagSize);
         } else if (nPrevTagIndex === 0) {
            assert.equal(0x0151, nPrevTagSize);
         } else if (nPrevTagIndex === 1) {
            assert.equal(0x38, nPrevTagSize);
         } else if (nPrevTagIndex === 2) {
            assert.equal(0x0f, nPrevTagSize);
         } else if (nPrevTagIndex === 3) {
            assert.equal(0x18FCE, nPrevTagSize);
         } else if (nPrevTagIndex === 4) {
            assert.equal(0x198, nPrevTagSize);
         }
         assert.equal(nPrevTagIndex, nPrevTagIndex);
         nPrevTagIndex++;
      }
   });
}
