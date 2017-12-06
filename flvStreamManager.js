const flvUtils = require('./flvUtils');
const FlvStreamMode = {
   FAST_RESPONSE: 1,
   REALTIME: 2
}
class FlvStreamManager {
   constructor() {
      this._mode = FlvStreamMode.FAST_RESPONSE;
      this._tracking = false;
   }

   getMode() {
      return this._mode;
   }

   setMode(eMode) {
      this._mode = eMode;
   }

   track(bfFlvStream) {
      flvUtils.parseStream(bfFlvStream, {
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

   }

   _onGetTag(bfData, oMetadata) {

   }

   _onGetLastTagSize(bfData, oMetadata) {

   }
}

module.exports = FlvStreamManager;