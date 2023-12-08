import {objToString} from "../utils/helper";

function isHmAppDefined() {
  return typeof hmApp !== 'undefined'
}

let _r = null;

if (typeof __$$R$$__ !== 'undefined') {
  _r = __$$R$$__;
} else {
  _r = () => {};
}


let getPackageInfo = null;

if (isZeppOS1()) {
  getPackageInfo = hmApp.getPackageInfo;
} else if (isZeppOS2()) {
  getPackageInfo = _r('@zos/app').getPackageInfo;
}

if (isZeppOS1()) {
  hmUI;
} else if (isZeppOS2()) {
  _r('@zos/ui');
  // ui = uiModule
}

if (isZeppOS1()) {
  hmSetting.getDeviceInfo;
} else if (isZeppOS2()) {
  _r('@zos/device').getDeviceInfo;
}
if (isZeppOS1()) {
  typeof __$$app$$__ !== 'undefined'
      ? __$$app$$__?.__globals__?.gettext
      : function () {
          throw new Error(`zeppos 1.0 required: import { gettext } from 'i18n'`)
        };
} else if (isZeppOS2()) {
  _r('@zos/i18n').getText;
}

if (isZeppOS1()) {
  hmApp.gotoPage;
} else if (isZeppOS2()) {
  _r('@zos/router').push;
}

let nativeBle = null;

if (isZeppOS1()) {
  nativeBle = hmBle;
} else if (isZeppOS2()) {
  nativeBle = _r('@zos/ble');
  // nativeBle = bleModule
}

function isZeppOS1() {
  return isZeppOS() && isAPILevel1()
}

function isZeppOS2() {
  return isZeppOS() && isAPILevel2()
}

function isAPILevel1() {
  return isHmAppDefined()
}

function isAPILevel2() {
  return typeof __$$R$$__ !== 'undefined'
}

function isZeppOS() {
  return isAPILevel1() || isAPILevel2()
}

function isSideService() {
  return typeof messaging !== 'undefined'
}

let logger$2 = null;


if (isZeppOS1()) {
  // zeppos 1.0
  logger$2 = DeviceRuntimeCore.HmLogger;
} else if (isZeppOS2()) {
  // zeppos 2.0
  logger$2 = _r('@zos/utils').log;
} else if (isSideService()) {
  // side service 1.0
  if (typeof Logger !== 'undefined') {
    logger$2 = Logger;
  }
}

const EventBus = _r('@zos/utils').EventBus;

const _setTimeout = _r('@zos/timer').setTimeout;
const _clearTimeout = _r('@zos/timer').clearTimeout;

function Deferred() {
  const defer = {
    canceled: false,
  };

  defer.promise = new Promise(function (resolve, reject) {
    defer.resolve = resolve;
    defer.reject = reject;
  });

  defer.cancel = () => {
    defer.canceled = true;
    defer.reject(new Error('Task canceled'));
  };

  return defer
}

function timeout(ms, cb) {
  const defer = Deferred();
  ms = ms || 1000;

  const wait = _setTimeout(() => {
    _clearTimeout(wait);

    if (cb) {
      cb && cb(defer.resolve, defer.reject);
    } else {
      defer.reject('Timed out in ' + ms + 'ms.');
    }
  }, ms);

  return defer.promise
}

function json2buf(json) {
  return str2buf(json2str(json))
}

function buf2json(buf) {
  return str2json(buf2str(buf))
}

function str2json(str) {
  return JSON.parse(str)
}

function json2str(json) {
  return JSON.stringify(json)
}

function str2buf(str) {
  return Buffer.from(str, 'utf-8')
}

function buf2str(buf) {
  return buf.toString('utf-8')
}

function bin2buf(bin) {
  return Buffer.from(bin)
}

function buf2hex(buf) {
  return buf.toString('hex')
}

function bin2hex(bin) {
  return buf2hex(bin2buf(bin))
}

const logger$1 = isZeppOS()
  ? logger$2.getLogger('device-message')
  : logger$2.getLogger('side-message');

const DEBUG = true;

const MESSAGE_SIZE = 3600;
const MESSAGE_HEADER = 16;
const MESSAGE_PAYLOAD = MESSAGE_SIZE - MESSAGE_HEADER;
const HM_MESSAGE_PROTO_HEADER = 66;
const HM_MESSAGE_PROTO_PAYLOAD =
  MESSAGE_PAYLOAD - HM_MESSAGE_PROTO_HEADER;

const MessageFlag = {
  Runtime: 0x0,
  App: 0x1,
};

const MessageType = {
  Shake: 0x1,
  Close: 0x2,
  Heart: 0x3,
  Data: 0x4,
  DataWithSystemTool: 0x5,
  Log: 0x6,
};
const MessageVersion = {
  Version1: 0x1,
};

const MessagePayloadType = {
  Request: 0x1,
  Response: 0x2,
  Notify: 0x3,
};

const DataType = {
  empty: 'empty',
  json: 'json',
  text: 'text',
  bin: 'bin',
};

const MessagePayloadDataTypeOp = {
  EMPTY: 0x0,
  TEXT: 0x1,
  JSON: 0x2,
  BIN: 0x3,
};

function getDataType(type) {
  switch (type.toLowerCase()) {
    case DataType.json:
      return MessagePayloadDataTypeOp.JSON
    case DataType.text:
      return MessagePayloadDataTypeOp.TEXT
    case DataType.bin:
      return MessagePayloadDataTypeOp.BIN
    case DataType.empty:
      return MessagePayloadDataTypeOp.EMPTY
    default:
      return MessagePayloadDataTypeOp.TEXT
  }
}

// 中续，结束
const MessagePayloadOpCode = {
  Continued: 0x0,
  Finished: 0x1,
};

let traceId = 10000;
function genTraceId() {
  return traceId++
}

let spanId = 1000;
function genSpanId() {
  return spanId++
}

function getTimestamp(t = Date.now()) {
  return t % 10000000
}

class Session extends EventBus {
  constructor(id, type, ctx) {
    super();
    this.id = id;
    this.type = type; // payloadType
    this.ctx = ctx;
    this.tempBuf = null;
    this.chunks = [];
    this.count = 0;
    this.finishChunk = null;
  }

  addChunk(payload) {
    if (payload.opCode === MessagePayloadOpCode.Finished) {
      this.count = payload.seqId;
      this.finishChunk = payload;
    }

    if (payload.payloadLength !== payload.payload.byteLength) {
      logger$1.error(
          'receive chunk data length error, expect %d but %d',
          payload.payloadLength,
          payload.payload.byteLength,
        );
      this.emit(
        'error',
        Error(
          `receive chunk data length error, expect ${payload.payloadLength} but ${payload.payload.byteLength}`,
        ),
      );
      return
    }

    this.chunks.push(payload);
    this.checkIfReceiveAllChunks();
  }

  checkIfReceiveAllChunks() {
    if (this.count !== this.chunks.length) return

    for (let i = 1; i <= this.count; i++) {
      const chunk = this.chunks.find((c) => c.seqId === i);

      if (!chunk) {
        this.releaseBuf();
        this.emit('error', Error('receive data error'));
        return
      }

      const buf = chunk.payload;
      this.tempBuf = this.tempBuf ? Buffer.concat([this.tempBuf, buf]) : buf;
    }

    if (!this.finishChunk) return

    this.finishChunk.payload = this.tempBuf;
    this.finishChunk.payloadLength = this.finishChunk.payload.byteLength;

    if (this.finishChunk.totalLength !== this.finishChunk.payloadLength) {
      logger$1.error(
          'receive full data length error, expect %d but %d',
          this.finishChunk.payloadLength,
          this.finishChunk.payload.byteLength,
        );
      this.emit(
        'error',
        Error(
          `receive full data length error, expect ${this.finishChunk.payloadLength} but ${this.finishChunk.payload.byteLength}`,
        ),
      );
      return
    }

    this.emit('data', this.finishChunk);
  }

  getLength() {
    return this.tempBufLength
  }
  releaseBuf() {
    this.tempBuf = null;
    this.chunks = [];
    this.finishChunk = null;
    this.count = 0;
  }
}

class SessionMgr {
  constructor() {
    this.sessions = new Map();
  }

  key(session) {
    return `${session.id}:${session.type}`
  }

  newSession(id, type, ctx) {
    const newSession = new Session(id, type, ctx);
    this.sessions.set(this.key(newSession), newSession);
    return newSession
  }

  destroy(session) {
    session.releaseBuf();
    this.sessions.delete(this.key(session));
  }

  has(id, type) {
    return this.sessions.has(
      this.key({
        id,
        type,
      }),
    )
  }

  getById(id, type) {
    return this.sessions.get(
      this.key({
        id,
        type,
      }),
    )
  }

  clear() {
    this.sessions.clear();
  }
}

const MessageErrorCode = {
  SUCCESS: 0,
  SHAKE_TIME_OUT: 1,
  BLE_CLOSE: 2,
  APP_CLOSE: 3,
  REQUEST_TIME_OUT: 4,
};

const MessageShakeTimeOut = 5000;

class MessageError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const ShakeStatus = {
  start: 1,
  pending: 2,
  success: 3,
  failure: 4,
};
class MessageBuilder extends EventBus {
  constructor(
    {
      appId = 0,
      appDevicePort = 20,
      appSidePort = 0,
      ble = isZeppOS() ? nativeBle : undefined,
    } = {
      appId: 0,
      appDevicePort: 20,
      appSidePort: 0,
      ble: isZeppOS() ? nativeBle : undefined,
    },
  ) {
    super();
    this.isDevice = isZeppOS();
    this.isSide = !this.isDevice;

    this.appId = appId;
    this.appDevicePort = appDevicePort;
    this.appSidePort = appSidePort;
    this.ble = ble;
    this.sendMsg = this.getSafeSend();
    this.chunkSize = MESSAGE_PAYLOAD;
    this.tempBuf = null;
    this.handlers = new Map();

    this.shakeTask = null;
    this.waitingShakePromise = null;

    this.shakeStatus = ShakeStatus.start;
    if (appSidePort ){
      this.shakeStatus = ShakeStatus.success;
    }

    this.shakeTimer = 0;

    this.sessionMgr = new SessionMgr();

    // 控制 response 的响应
    this.on('response', (resp) => {
      this.onResponse(resp);
    });
  }

  fork(timeout = MessageShakeTimeOut) {
    if (this.shakeStatus === ShakeStatus.pending) {
      return this.waitingShakePromise
    }

    this.shakeTask = Deferred();
    this.waitingShakePromise = this.shakeTask.promise;

    if (this.shakeStatus === ShakeStatus.success){

      logger$1.warn(
          'shakeTask auto resolve ',
      );
      this.shakeTask.resolve();
      return this.waitingShakePromise
    }

    this.shakeStatus = ShakeStatus.start;
    this.clearShakeTimer();

    this.shakeTimer = _setTimeout(() => {
      this.shakeStatus = ShakeStatus.failure;
      this.shakeTask.reject(
        new MessageError(MessageErrorCode.SHAKE_TIME_OUT, 'shake timeout'),
      );
    }, timeout);

    this.shakeStatus = ShakeStatus.pending;
    this.sendShake();

    return this.waitingShakePromise
  }

  clearShakeTimer() {
    if (this.shakeTimer) {
      _clearTimeout(this.shakeTimer);
    }

    this.shakeTimer = 0;
  }

  getMessageSize() {
    return MESSAGE_SIZE
  }

  getMessagePayloadSize() {
    return MESSAGE_PAYLOAD
  }

  getMessageHeaderSize() {
    return MESSAGE_HEADER
  }

  buf2Json(buf) {
    return buf2json(buf)
  }

  json2Buf(json) {
    return json2buf(json)
  }

  now(t = Date.now()) {
    return getTimestamp(t)
  }

  connect(cb) {
    this.on('message', (message) => {
      this.onMessage(message);
    });

    this.ble &&
      this.ble.createConnect((index, data, size) => {
        logger$1.warn(
            '[RAW] [R] receive index=>%d size=>%d',
            index,
            size
        );

        // logger$1.warn(
        //     '[RAW] [R] receive index=>%d size=>%d bin=>%s',
        //     index,
        //     size,
        //     bin2hex(data),
        //   );
        this.onFragmentData(data);
      });

    cb && cb(this);
  }

  disConnect(cb) {
    logger$1.debug('app ble disconnect');
    this.sendClose();
    this.off('message');
    this.handlers.clear();
    this.ble && this.ble.disConnect();

    cb && cb(this);
  }

  listen(cb) {
    this.appSidePort = globalThis.getApp().port2;
    messaging &&
      messaging.peerSocket.addListener('message', (message) => {
        logger$1.warn(
            '[RAW] [R] receive size=>%d bin=>%s',
            message.byteLength,
            bin2hex(message),
          );
        this.onMessage(message);
      });

    this.waitingShakePromise = Promise.resolve();
    cb && cb(this);
  }

  buildBin(data) {
    if (data.payload.byteLength > this.chunkSize) {
      throw new Error(
        `${data.payload.byteLength} greater than max size of ${this.chunkSize}`,
      )
    }

    const size = this.getMessageHeaderSize() + data.payload.byteLength;
    let buf = Buffer.alloc(size);
    let offset = 0;

    buf.writeUInt8(data.flag, offset);
    offset += 1;

    buf.writeUInt8(data.version, offset);
    offset += 1;

    buf.writeUInt16LE(data.type, offset);
    offset += 2;

    buf.writeUInt16LE(data.port1, offset);
    offset += 2;

    buf.writeUInt16LE(data.port2, offset);
    offset += 2;

    buf.writeUInt32LE(data.appId, offset);
    offset += 4;

    buf.writeUInt32LE(data.extra, offset);
    offset += 4;

    buf.fill(data.payload, offset, data.payload.byteLength + offset);


    debug &&
    logger$1.warn(
        'sendBin=%d ',
        buf.byteLength,
    );

    return buf
  }

  buildShake() {
    return this.buildBin({
      flag: MessageFlag.App,
      version: MessageVersion.Version1,
      type: MessageType.Shake,
      port1: this.appDevicePort,
      port2: this.appSidePort,
      appId: this.appId,
      extra: 0,
      payload: Buffer.from([this.appId]),
    })
  }

  sendShake() {
    logger$1.info('shake send');
    const shake = this.buildShake();
    this.sendMsg(shake);
  }

  buildClose() {
    return this.buildBin({
      flag: MessageFlag.App,
      version: MessageVersion.Version1,
      type: MessageType.Close,
      port1: this.appDevicePort,
      port2: this.appSidePort,
      appId: this.appId,
      extra: 0,
      payload: Buffer.from([this.appId]),
    })
  }

  sendClose() {
    logger$1.info('close send');
    const close = this.buildClose();
    this.sendMsg(close);
  }

  readBin(arrayBuf) {
    const buf = Buffer.from(arrayBuf);
    let offset = 0;

    const flag = buf.readUInt8(offset);
    offset += 1;

    const version = buf.readUInt8(offset);
    offset += 1;

    const type = buf.readUInt16LE(offset);
    offset += 2;

    const port1 = buf.readUInt16LE(offset);
    offset += 2;

    const port2 = buf.readUInt16LE(offset);
    offset += 2;

    const appId = buf.readUInt32LE(offset);
    offset += 4;

    const extra = buf.readUInt32LE(offset);
    offset += 4;

    const payload = buf.subarray(offset);

    return {
      flag,
      version,
      type,
      port1,
      port2,
      appId,
      extra,
      payload,
    }
  }

  // opts 覆盖头部选项
  buildData(payload, opts = {}) {
    return this.buildBin({
      flag: MessageFlag.App,
      version: MessageVersion.Version1,
      type: MessageType.Data,
      port1: this.appDevicePort,
      port2: this.appSidePort,
      appId: this.appId,
      extra: 0,
      ...opts,
      payload,
    })
  }

  sendBin(buf, debug = DEBUG) {
    // ble 发送消息
    debug &&
    logger$1.warn(
        'sendBin=%d ',
        buf.byteLength,
    );
    // debug &&
    //   logger$1.warn(
    //     '[RAW] [S] send size=%d bin=%s',
    //     buf.byteLength,
    //     bin2hex(buf.buffer),
    //   );
    const result = this.ble.send(buf.buffer, buf.byteLength);

    if (!result) {
      throw Error('send message error')
    }
  }

  sendBinBySide(buf, debug = DEBUG) {
    // side 发送消息
    debug &&
      logger$1.warn(
        '[RAW] [S] send size=%d bin=%s',
        buf.byteLength,
        bin2hex(buf.buffer),
      );
    messaging.peerSocket.send(buf.buffer);
  }

  // 通用获取逻辑
  getSafeSend() {
    if (this.isDevice) {
      return this.sendBin.bind(this)
    } else {
      return this.sendBinBySide.bind(this)
    }
  }

  // 大数据的复杂头部分包协议
  sendHmProtocol(
    { requestId, dataBin, type, contentType, dataType },
    { messageType = MessageType.Data } = {},
  ) {
    const headerSize = 0;
    const hmDataSize = HM_MESSAGE_PROTO_PAYLOAD;
    const userDataLength = dataBin.byteLength;

    let offset = 0;
    const _buf = Buffer.alloc(hmDataSize);
    const traceId = requestId ? requestId : genTraceId();
    const spanId = genSpanId();
    let seqId = 1;

    const count = Math.ceil(userDataLength / hmDataSize);

    function genSeqId() {
      return seqId++
    }

    for (let i = 1; i <= count; i++) {
      this.errorIfBleDisconnect();
      if (i === count) {
        // last
        const tailSize = userDataLength - offset;
        const tailBuf = Buffer.alloc(headerSize + tailSize);

        dataBin.copy(tailBuf, headerSize, offset, offset + tailSize);
        offset += tailSize;
        this.sendDataWithSession(
          {
            traceId,
            spanId: spanId,
            seqId: genSeqId(),
            payload: tailBuf,
            type,
            opCode: MessagePayloadOpCode.Finished,
            totalLength: userDataLength,
            contentType,
            dataType,
          },
          {
            messageType,
          },
        );

        break
      }

      dataBin.copy(_buf, headerSize, offset, offset + hmDataSize);
      offset += hmDataSize;

      this.sendDataWithSession(
        {
          traceId,
          spanId: spanId,
          seqId: genSeqId(),
          payload: _buf,
          type,
          opCode: MessagePayloadOpCode.Continued,
          totalLength: userDataLength,
          contentType,
          dataType,
        },
        {
          messageType,
        },
      );
    }

    if (offset === userDataLength) {
      logger$1.debug(
          'HmProtocol send ok msgSize=> %d dataSize=> %d',
          offset,
          userDataLength,
        );
    } else {
      logger$1.error(
          'HmProtocol send error msgSize=> %d dataSize=> %d',
          offset,
          userDataLength,
        );
    }
  }

  sendJson({
    requestId = 0,
    json,
    type = MessagePayloadType.Request,
    contentType,
    dataType,
  }) {

    logger$1.warn(
        'sendJson %s',
        objToString(json)
    );

    const packageBin = json2buf(json);
    const traceId = requestId ? requestId : genTraceId();

    this.sendHmProtocol({
      requestId: traceId,
      dataBin: packageBin,
      type,
      contentType,
      dataType,
    });
  }

  sendBuf({
    requestId = 0,
    buf,
    type = MessagePayloadType.Request,
    contentType,
    dataType,
  }) {
    const traceId = requestId ? requestId : genTraceId();

    return this.sendHmProtocol({
      requestId: traceId,
      dataBin: buf,
      type,
      contentType,
      dataType,
    })
  }

  sendDataWithSession(
    {
      traceId,
      spanId,
      seqId,
      payload,
      type,
      opCode,
      totalLength,
      contentType,
      dataType,
    },
    { messageType },
  ) {
    const payloadBin = this.buildPayload({
      traceId,
      spanId,
      seqId,
      totalLength,
      type,
      opCode,
      payload,
      contentType,
      dataType,
    });

    let data = this.isDevice
      ? this.buildData(payloadBin, {
          type: messageType,
        })
      : payloadBin;

    this.sendMsg(data);
  }

  buildPayload(data) {
    const size = HM_MESSAGE_PROTO_HEADER + data.payload.byteLength;
    let buf = Buffer.alloc(size);
    let offset = 0;

    // header
    // traceId
    buf.writeUInt32LE(data.traceId, offset);
    offset += 4;

    // parentId
    buf.writeUInt32LE(0, offset);
    offset += 4;

    // spanId
    buf.writeUInt32LE(data.spanId, offset);
    offset += 4;

    // seqId // 顺序 id,消息部分顺序序列号
    buf.writeUInt32LE(data.seqId, offset);
    offset += 4;

    // message total length
    buf.writeUInt32LE(data.totalLength, offset);
    offset += 4;

    // payload length 当前
    buf.writeUInt32LE(data.payload.byteLength, offset);
    offset += 4;

    // payload type
    buf.writeUInt8(data.type, offset);
    offset += 1;

    // opCode
    buf.writeUInt8(data.opCode, offset);
    offset += 1;

    // timestamp1
    buf.writeUInt32LE(this.now(), offset);
    offset += 4;

    // timestamp2
    buf.writeUInt32LE(0, offset);
    offset += 4;

    // timestamp3
    buf.writeUInt32LE(0, offset);
    offset += 4;

    // timestamp4
    buf.writeUInt32LE(0, offset);
    offset += 4;

    // timestamp5
    buf.writeUInt32LE(0, offset);
    offset += 4;

    // timestamp6
    buf.writeUInt32LE(0, offset);
    offset += 4;

    // timestamp7
    buf.writeUInt32LE(0, offset);
    offset += 4;

    // request content data type
    buf.writeUInt8(data.contentType, offset);
    offset += 1;

    // response data type
    buf.writeUInt8(data.dataType, offset);
    offset += 1;

    buf.writeUInt16LE(0, offset);
    offset += 2;

    // extra1
    buf.writeUInt32LE(0, offset);
    offset += 4;

    // extra2
    buf.writeUInt32LE(0, offset);
    offset += 4;

    // payload
    buf.fill(data.payload, offset, data.payload.byteLength + offset);

    return buf
  }

  readPayload(arrayBuf) {
    const buf = Buffer.from(arrayBuf);
    let offset = 0;

    const traceId = buf.readUInt32LE(offset);
    offset += 4;

    const parentId = buf.readUInt32LE(offset);
    offset += 4;

    const spanId = buf.readUInt32LE(offset);
    offset += 4;

    const seqId = buf.readUInt32LE(offset);
    offset += 4;

    const totalLength = buf.readUInt32LE(offset);
    offset += 4;

    const payloadLength = buf.readUInt32LE(offset);
    offset += 4;

    const payloadType = buf.readUInt8(offset);
    offset += 1;

    const opCode = buf.readUInt8(offset);
    offset += 1;

    const timestamp1 = buf.readUInt32LE(offset);
    offset += 4;

    const timestamp2 = buf.readUInt32LE(offset);
    offset += 4;

    const timestamp3 = buf.readUInt32LE(offset);
    offset += 4;

    const timestamp4 = buf.readUInt32LE(offset);
    offset += 4;

    const timestamp5 = buf.readUInt32LE(offset);
    offset += 4;

    const timestamp6 = buf.readUInt32LE(offset);
    offset += 4;

    const timestamp7 = buf.readUInt32LE(offset);
    offset += 4;

    // request data type
    const contentType = buf.readUInt8(offset);
    offset += 1;

    // response data type
    const dataType = buf.readUInt8(offset);
    offset += 1;

    const extra1 = buf.readUInt16LE(offset);
    offset += 2;

    const extra2 = buf.readUInt32LE(offset);
    offset += 4;

    const extra3 = buf.readUInt32LE(offset);
    offset += 4;

    const payload = buf.subarray(offset);

    return {
      traceId,
      parentId,
      spanId,
      seqId,
      totalLength,
      payloadLength,
      payloadType,
      opCode,
      contentType,
      dataType,
      timestamp1,
      timestamp2,
      timestamp3,
      timestamp4,
      timestamp5,
      timestamp6,
      timestamp7,
      extra1,
      extra2,
      extra3,
      payload,
    }
  }

  onFragmentData(bin) {
    const data = this.readBin(bin);
    this.emit('raw', bin);

    logger$1.debug('watch received data');
    //logger$1.debug('received data=>', objToString(data));
    if (data.flag === MessageFlag.App && data.type === MessageType.Shake) {
      this.appSidePort = data.port2;
      logger$1.debug('shake success appSidePort=>', data.port2);
      this.emit('shake:response', data);
      this.clearShakeTimer();
      this.shakeTask.resolve();
      this.shakeStatus = ShakeStatus.success;
    } else if (
      data.flag === MessageFlag.App &&
      data.type === MessageType.Data
    ) {
      this.emit('message', data.payload);
      this.emit('read', data);
    } else if (
      data.flag === MessageFlag.App &&
      data.type === MessageType.DataWithSystemTool
    ) {
      this.emit('message', data.payload);
      this.emit('read', data);
    } else if (data.flag === MessageFlag.App && data.type === MessageType.Log) {
      this.emit('log', data.payload);
    } else if (data.flag === MessageFlag.Runtime) {
      logger$1.debug('receive runtime => flag %d type %d', data.flag, data.type);
    } else if (
      data.flag === MessageFlag.App &&
      data.type === MessageType.Close
    ) {
      this.appSidePort = 0;
      logger$1.debug('receive close =>', this.appSidePort);
    } else {
      logger$1.error('error appSidePort=>%d data=>%j', this.appSidePort, data);
    }
  }

  errorIfBleDisconnect() {
    if (!isZeppOS()) {
      return
    }

    const isBleConnected = this.ble.connectStatus();

    if (!isBleConnected) {
      throw new MessageError(MessageErrorCode.BLE_CLOSE, 'ble disconnect')
    }
  }

  errorIfSideServiceDisconnect() {
    if (!isZeppOS) {
      return
    }

    if (!this.appSidePort) {
      throw new MessageError(
        MessageErrorCode.APP_CLOSE,
        'side service is not running',
      )
    }
  }

  getRequestCount() {
    return this.handlers.size
  }

  onResponse(fullPayload) {
    const handler = this.handlers.get(fullPayload.traceId);
    handler && handler(fullPayload);
  }

  onMessage(messagePayload) {
    const payload = this.readPayload(messagePayload);
    let session = this.sessionMgr.getById(payload.traceId, payload.payloadType);

    if (!session) {
      session = this.sessionMgr.newSession(
        payload.traceId,
        payload.payloadType,
        this,
      );

      // TODO: 需要考虑缓冲，监听回调要放到启动之前，或者没有增加监听就缓存请求
      session.on('data', (fullPayload) => {
        if (fullPayload.opCode === MessagePayloadOpCode.Finished) {
          if (fullPayload.payloadType === MessagePayloadType.Request) {
            this.emit('request', {
              request: fullPayload,
              response: ({ data }) => {
                this.response({
                  requestId: fullPayload.traceId,
                  contentType: fullPayload.contentType,
                  dataType: fullPayload.dataType,
                  data,
                });
              },
            });
          } else if (fullPayload.payloadType === MessagePayloadType.Response) {
            this.emit('response', fullPayload);
          } else if (fullPayload.payloadType === MessagePayloadType.Notify) {
            this.emit('call', fullPayload);
          }

          this.emit('data', fullPayload);
          this.sessionMgr.destroy(session);
        }
      });

      session.on('error', (error) => {
        this.sessionMgr.destroy(session);
        this.emit('error', error);
      });
    }

    session.addChunk(payload);
  }

  /**
   * 发送请求
   * @param {object buffer arraybuffer arraybuffer like} data 传输的数据
   * @param {*} opts
   * @returns
   */
  request(data, opts) {
    try {
      this.errorIfBleDisconnect();
    } catch (error) {
      return Promise.reject(error)
    }

    const requestTask = () => {
      this.errorIfBleDisconnect();
      this.errorIfSideServiceDisconnect();

      const defaultOpts = {
        timeout: 60000,
        contentType: 'json',
        dataType: 'json',
      };
      const requestId = genTraceId();
      const requestPromiseTask = Deferred();
      opts = Object.assign(defaultOpts, opts);

      const transact = ({ traceId, payload, dataType }) => {
        this.errorIfBleDisconnect();
        this.errorIfSideServiceDisconnect();

        logger$1.debug(
            'transact traceId=>%d',
            traceId,
        );
        // logger$1.debug(
        //     'traceId=>%d payload=>%s',
        //     traceId,
        //     payload.toString('hex'),
        //   );

        let result;
        switch (dataType) {
          case MessagePayloadDataTypeOp.TEXT:
            result = buf2str(payload);
            break
          case MessagePayloadDataTypeOp.BIN:
            result = payload;
            break
          case MessagePayloadDataTypeOp.JSON:
            result = buf2json(payload);
            break
          default: // text
            result = payload;
            break
        }
       // payload = null;
        this.emit('data:result', result);

        //logger$1.debug('request id=>%d', requestId);
        // logger$1.debug('request id=>%d payload=>%j', requestId, data);
        // logger$1.debug('response id=>%d payload=>%j', requestId, result);
        requestPromiseTask.resolve(result);

      };

      // this.on('response', transact)
      this.handlers.set(requestId, transact);
      if (Buffer.isBuffer(data)) {
        this.sendBuf({
          requestId,
          buf: data,
          type: MessagePayloadType.Request,
          contentType: MessagePayloadDataTypeOp.BIN,
          dataType: getDataType(opts.dataType),
        });
      } else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
        this.sendBuf({
          requestId,
          buf: Buffer.from(data),
          type: MessagePayloadType.Request,
          contentType: MessagePayloadDataTypeOp.BIN,
          dataType: getDataType(opts.dataType),
        });
      } else {
        this.sendJson({
          requestId,
          json: data,
          type: MessagePayloadType.Request,
          contentType: MessagePayloadDataTypeOp.JSON,
          dataType: getDataType(opts.dataType),
        });
      }

      let hasReturned = false;

      return Promise.race([
        timeout(opts.timeout, (resolve, reject) => {
          if (hasReturned) {
            return resolve()
          }

          logger$1.error(
              `request timeout in ${opts.timeout}ms error=> %d data=> %j`,
              requestId,
              data,
            );

          reject(
            new MessageError(
              MessageErrorCode.REQUEST_TIME_OUT,
              `request timed out in ${opts.timeout}ms.`,
            ),
          );
        }),
        requestPromiseTask.promise.finally(() => {
          hasReturned = true;
        }),
      ])
        .catch((e) => {
          logger$1.error('error %j', e);
          throw e
        })
        .finally(() => {
          this.handlers.delete(requestId);
        })
    };

    return this.waitingShakePromise.then(requestTask)
  }

  /**
   * 相应接口给当前请求
   * @param {obj} param0
   */
  response({ requestId, contentType, dataType, data }) {
    if (MessagePayloadDataTypeOp.BIN === dataType) {
      this.sendBuf({
        requestId,
        buf: data,
        type: MessagePayloadType.Response,
        contentType,
        dataType,
      });
    } else {
      this.sendJson({
        requestId,
        json: data,
        type: MessagePayloadType.Response,
        contentType,
        dataType,
      });
    }
  }

  /**
   * call 模式调用接口到伴生服务
   * @param {json | buffer} data
   * @returns
   */
  call(data) {
    return this.waitingShakePromise.then(() => {
      if (Buffer.isBuffer(data)) {
        return this.sendBuf({
          buf: data,
          type: MessagePayloadType.Notify,
          contentType: MessagePayloadDataTypeOp.BIN,
          dataType: MessagePayloadDataTypeOp.EMPTY,
        })
      } else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
        return this.sendBuf({
          buf: Buffer.from(data),
          type: MessagePayloadType.Notify,
          contentType: MessagePayloadDataTypeOp.BIN,
          dataType: MessagePayloadDataTypeOp.EMPTY,
        })
      } else {
        return this.sendJson({
          json: data,
          type: MessagePayloadType.Notify,
          contentType: MessagePayloadDataTypeOp.JSON,
          dataType: MessagePayloadDataTypeOp.EMPTY,
        })
      }
    })
  }
}

const logger = logger$2.getLogger('message-builder');

const shakeTimeout = 5000;
const requestTimeout = 60000;

function wrapperMessage(messageBuilder) {
  return {
    shakeTimeout,
    requestTimeout,
    transport: messageBuilder,
    onCall(cb) {
      if (!cb) return this
      messageBuilder.on('call', ({ payload }) => {
        const jsonRpc = messageBuilder.buf2Json(payload);
        cb && cb(jsonRpc);
      });

      return this
    },
    offOnCall(cb) {
      messageBuilder.off('call', cb);
      return this
    },
    call(data) {
      isZeppOS() && messageBuilder.fork(this.shakeTimeout);
      return messageBuilder.call({
        jsonrpc: 'hmrpcv1',
        ...data,
      })
    },
    onRequest(cb) {
      if (!cb) return this
      messageBuilder.on('request', (ctx) => {
        const jsonRpc = messageBuilder.buf2Json(ctx.request.payload);
        cb &&
          cb(jsonRpc, (error, data) => {
            if (error) {
              return ctx.response({
                data: {
                  error,
                },
              })
            }

            return ctx.response({
              data: {
                result: data,
              },
            })
          });
      });

      return this
    },
    cancelAllRequest() {
      messageBuilder.off('response');
      return this
    },
    offOnRequest(cb) {
      messageBuilder.off('request', cb);
      return this
    },
    request(data) {
      isZeppOS() && messageBuilder.fork(this.shakeTimeout);
      logger.debug(
          'current request count=>%d',
          messageBuilder.getRequestCount(),
        );
      return messageBuilder
        .request(
          {
            jsonrpc: 'hmrpcv1',
            ...data,
          },
          {
            timeout: this.requestTimeout,
          },
        )
        .then(({ error, result }) => {
          if (error) {
            throw error
          }

          return result
        })
    },
    // 设备接口
    connect() {
      messageBuilder.connect(() => {
        logger.debug('DeviceApp messageBuilder connect with SideService');
      });
      return this
    },
    disConnect() {
      this.cancelAllRequest();
      this.offOnRequest();
      this.offOnCall();
      messageBuilder.disConnect(() => {
        logger.debug('DeviceApp messageBuilder disconnect SideService');
      });
      return this
    },
    // 伴生服务接口
    start() {
      messageBuilder.listen(() => {
        logger.debug(
            'SideService messageBuilder start to listen to DeviceApp',
          );
      });
      return this
    },
    stop() {
      this.cancelAllRequest();
      this.offOnRequest();
      this.offOnCall();
      messageBuilder.disConnect(() => {
        logger.debug('SideService messageBuilder stop to listen to DeviceApp');
      });
      return this
    },
  }
}

const appDevicePort = 20;

function createDeviceMessage(appSidePort = 0) {
  const messageBuilder = new MessageBuilder({
    appId: getPackageInfo().appId,
    appDevicePort,
    appSidePort,
  });
  return wrapperMessage(messageBuilder)
}

function getFileTransfer(fileTransfer) {
  /**
   *     start(newfile)------------finished(file)
   *     device supported newfile and file
   *     side supported file
   */

  return {
    onFile(cb) {
      if (!cb) {
        return this
      }

      if (typeof fileTransfer === 'undefined') {
        return this
      }

      // at file task start
      fileTransfer.inbox.on('newfile', function () {
        const file = fileTransfer.inbox.getNextFile();
        cb && cb(file);
      });
      return this
    },
    onSideServiceFileFinished(cb) {
      if (!cb) {
        return this
      }

      if (typeof fileTransfer === 'undefined') {
        return this
      }

      // at file task finished
      fileTransfer.inbox.on('file', function () {
        const file = fileTransfer.inbox.getNextFile();
        cb && cb(file);
      });
      return this
    },
    emitFile() {
      fileTransfer.inbox.emit('file');
      return this
    },
    offFile() {
      if (typeof fileTransfer === 'undefined') {
        return this
      }

      fileTransfer.inbox.off('newfile');
      fileTransfer.inbox.off('file');
      return this
    },
    getFile() {
      if (typeof fileTransfer === 'undefined') {
        return null
      }

      return fileTransfer.inbox.getNextFile()
    },
    sendFile(path, opts) {
      if (typeof fileTransfer === 'undefined') {
        throw new Error('fileTransfer is not available')
      }

      return fileTransfer.outbox.enqueueFile(path, opts)
    },
  }
}

const TransferFile = _r('@zos/ble/TransferFile');
const fileTransferLib = getFileTransfer(new TransferFile());

function BaseApp({ globalData = {}, onCreate, onDestroy, sidePort, onMessagingCreate, ...other } = {}) {
  return {
    globalData,
    ...other,
    onCreate(...opts) {
      const messaging = createDeviceMessage(sidePort);
      this.globalData.messaging = messaging;

      onMessagingCreate?.apply(this);

      messaging
        .onCall(this.onCall?.bind(this))
        .onRequest(this.onRequest?.bind(this))
        .connect();

      fileTransferLib.onFile(this.onReceivedFile?.bind(this));

      onCreate?.apply(this, opts);
    },
    onDestroy(...opts) {
      const messaging = this.globalData.messaging;
      messaging.offOnCall().offOnRequest().disConnect();

      fileTransferLib.offFile();
      onDestroy?.apply(this, opts);
    },
    httpRequest(data) {
      return messaging.request({
        method: 'http.request',
        params: data,
      })
    },
  }
}

export { BaseApp };
