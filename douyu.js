const url = require('url');
const http = require('http');
const assert = require('assert');

var douyu = {};

/*
 * @param sRoomId
 * @param oPayload
 * @param fCallback(sUrl)
 */
function getPlay(sRoomId, oPayload, fCallback) {
    var sUrl = "http://www.douyu.com/lapi/live/getPlay/" + sRoomId;
    var sPayload = "";
    var oUrl = url.parse(sUrl);

    var oOption = {
        hostname: oUrl.hostname,
        //port: 80,
        path: oUrl.path,
        method: 'POST',
        headers: {}
    };

    if (typeof oPayload == 'string') {
        sPayload = oPayload;

    } else if (typeof oPayload == 'object') {

    }
    
    oOption.headers["Content-Length"] = sPayload.length;
    var oReq = http.request(oOption, function(res){
        if (res.statusCode != 200) {
            throw "error! status code = " + res.statusCode;
        }

        let rawData = '';
        res.on('data', function(chunk){
            rawData += chunk;
        });
        res.on('end', function(){
            //console.log(rawData);
            var rtmpUrl = _getUrlFromPlay(rawData);
            fCallback(rtmpUrl);
        });
    });
    oReq.write(sPayload);
    oReq.end();
}

function _getUrlFromPlay(sData) {
    //try {
    var oData = JSON.parse(sData);
    
    //var sBaseUrl = "http://hdl3.douyucdn.cn/live/";
    var sUrl = oData.data.rtmp_url + "/" + oData.data.rtmp_live;
    //console.log(sUrl);

    //}
    //catch (ex) {
    //    console.error(ex);
    //}
    return sUrl;
}

douyu.getPlay = getPlay;
module.exports = douyu;
