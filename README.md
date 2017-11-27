# flvUtils

1. header
struct Header {
   BYTE type[3], // FLV
   BYTE version, // 0x01
   BYTE streamInfo, // 0x05 = 101b = video + audio
   int headerLength // 0x09
}

2. body
struct Body {
   int PrevTagSize0,
   Tag tag1,
   int PrevTagSize1,
   Tag tag2,
   int PrevTagSize2,
   ......
   Tag tagN,
   int PrevTagSizeN
}

3. Tag
struct TagHeader {
   BYTE type,
   BYTE dataLength,
   BYTE timestamp[3], // ms
   BYTE timestampHigh, // high 8 bit
   BYTE streamsID[3], // 0
}

struct Tag {
   TagHeader header,
   BYTE data[0]
}