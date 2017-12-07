const EventEmitter = require('events');
const flvUtils = require('./flvUtils');

const FlvStreamMode = {
   FAST_RESPONSE: 1,
   REALTIME: 2
};

class FlvStreamManager {
   constructor() {
      this._mode = FlvStreamMode.FAST_RESPONSE;
      this._keyFramesToCache = 1;
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
   }

   track(flvStream) {
      reset();
      this._flvStream = flvStream;
      flvUtils.parseStream(flvStream, {
         onGetHeader: this._onGetHeader,
         onGetTag: this._onGetTag,
         onGetLastTagSize: this._onGetLastTagSize
      });
   }

   untrack() {

   }

   subscribe() {

   }

   _onGetHeader(bfData, oMetadata) {
      this._streamHeader = bfData;
   }

   _onGetTag(bfData, oMetadata) {
      if (this._streamTagsCount < 3) {
         this._streamTopTags.push(bfData);
      } else {
         this._pushStreamToCaches(bfData, oMetadata);
      }
      this._streamTagsCount++;
   }

   _onGetLastTagSize(bfData, oMetadata) {

   }

   _pushStreamToCaches(bfData, oMetadata) {
      if (oMetadata.tagType === 9 && oMetadata.videoInfo.type === 1) {
         if (this._keyFrameIndices.length >= this._keyFramesToCache ) {
            this._popStreamFromCaches();
         }
         this._keyFrameIndices.push(this._streamCaches.length);
      }
      this._streamCaches.push(bfData);
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
}

module.exports = {
   FlvStreamManager: FlvStreamManager,
   FlvStreamMode: FlvStreamMode
};