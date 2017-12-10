const EventEmitter = require('events');
const flvUtils = require('./flvUtils');

const FlvStreamMode = {
   FAST_RESPONSE: 1,
   REALTIME: 2
};

class FlvStreamManager {
   constructor() {
      this._mode = FlvStreamMode.FAST_RESPONSE;
      this._keyFramesToCache = 10;
      this._eventEmitter = new EventEmitter();
   }

   getMode() {
      return this._mode;
   }

   setMode(eMode) {
      this._mode = eMode;
   }

   reset() {
      this._tracking = false;
      this._flvStream = null;
      this._streamHeader = null;
      this._streamTopTags = [];
      this._streamCaches = [];
      this._keyFrameIndices = [];
      this._streamTagsCount = 0;
      this._bPrevAudioSizeUpdated = false;
      this._fOnDataList = {};
   }

   track(flvStream) {
      this.reset();
      this._flvStream = flvStream;
      flvUtils.parseStream(flvStream, {
         onGetHeader: (bfData, oMetadata) => { this._onGetHeader(bfData, oMetadata); },
         onGetTag: (bfData, oMetadata) => { this._onGetTag(bfData, oMetadata); },
         onGetLastTagSize: (bfData, oMetadata) => { this._onGetLastTagSize(bfData, oMetadata); }
      });
   }

   untrack() {
      var oSocket = this._flvStream.socket;
      oSocket.destroy();
      this._tracking = false;
   }

   subscribe(fOnData, fOnEnd) {
      if (!this._tracking) {
         return;
      }

      fOnData(this._streamHeader);
      fOnData(Buffer.concat(this._streamTopTags));
      // start from the key frame
      var aLatestStream = this._getAllStreamFromCaches();
      // for (var i=0; i<aLatestStream.length; i++) {
      //    fOnData(aLatestStream[i]);
      // }
      var bfLatestStream = Buffer.concat(aLatestStream);
      var aPrevAudioSize = Buffer.from([0x0, 0x0, 0x0, 0xf]);
      aPrevAudioSize.copy(bfLatestStream, 0);
      console.log(bfLatestStream.slice(0, 20));
      this._bPrevAudioSizeUpdated = true;
      fOnData(bfLatestStream);

      var _fOnData = (bfData, oMetadata) => {
         // if (!this._bPrevAudioSizeUpdated) {
         //    // the first 4 byte should be update

         // }
         fOnData(bfData, oMetadata);
      };
      this._fOnDataList[fOnData] = _fOnData;
      this._eventEmitter.addListener('data', _fOnData);
      this._eventEmitter.addListener('end', fOnEnd);
   }

   unsubscribe(fOnData, fOnEnd) {
      var _fOnData = this._fOnDataList[fOnData];
      console.log(_fOnData);
      delete this._fOnDataList[fOnData];
      this._bPrevAudioSizeUpdated = false;
      this._eventEmitter.removeListener('data', _fOnData);
      this._eventEmitter.removeListener('end', fOnEnd);
   }

   _onData(bfData, oMetadata, fOnData) {

   }

   _onEnd() {
      
   }

   _onGetHeader(bfData, oMetadata) {
      this._streamHeader = bfData;
   }

   _onGetTag(bfData, oMetadata) {
      if (this._streamTagsCount < 3) {
         this._streamTopTags.push(bfData);
         if (this._streamTagsCount === 2) {
            this._tracking = true;
         }
         console.log('>>> ', bfData);
      } else {
         this._pushStreamToCaches(bfData, oMetadata);
         this._eventEmitter.emit('data', bfData);
         //console.log('>>> ', bfData.length);
      }
      this._streamTagsCount++;
   }

   _onGetLastTagSize(bfData, oMetadata) {
      this._eventEmitter.emit('data', bfData);
      this._eventEmitter.emit('end');
   }

   _pushStreamToCaches(bfData, oMetadata) {
      if (oMetadata.tagType === 9 && oMetadata.dataInfo.videoType === 1) {
         if (this._keyFrameIndices.length >= this._keyFramesToCache ) {
            this._popStreamFromCaches();
         }
         this._keyFrameIndices.push(this._streamCaches.length);
         console.log('_keyFrameIndices = ', this._keyFrameIndices);
      }
      this._streamCaches.push(bfData);
      //console.log('this._streamCaches.length = ' + this._streamCaches.length);
   }

   _popStreamFromCaches() {
      // Cache is fulfilled. Prune it.
      var nStartPos = this._keyFrameIndices[0];
      var nEndPos = this._keyFrameIndices.length > 1 ? this._keyFrameIndices[1] : this._streamCaches.length;
      var nToRemove = nEndPos - nStartPos;
      this._streamCaches.splice(0, nToRemove);

      // update _keyFrameIndices
      this._keyFrameIndices.shift();
      for (var i = 0; i < this._keyFrameIndices.length; i++) {
         this._keyFrameIndices[i] -= nToRemove;
      }
   }

   _getLatestStreamFromCaches() {
      var nLastPos = this._keyFrameIndices.length - 1;
      var nLastKeyFrame = this._keyFrameIndices[nLastPos];
      return this._streamCaches.slice(nLastKeyFrame);
   }

   _getAllStreamFromCaches() {
      return this._streamCaches;
   }
}

module.exports = {
   FlvStreamManager: FlvStreamManager,
   FlvStreamMode: FlvStreamMode
};