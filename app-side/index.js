import { json2str, str2buf, str2json } from "../shared/data";
import { MessageBuilder } from "../shared/message";
import {
  Commands,
  SERVER_INFO_URL,
  SERVER_URL,
} from "../utils/config/constants";

var buff = {};

function getInfo() {
  return buff;
}

function setInfo(data) {
  buff = data;
}

// const logger = DeviceRuntimeCore.HmLogger.getLogger("watchdrip_side");
const messageBuilder = new MessageBuilder();

const fetchInfo = async (ctx) => {
  let resp = {};
  try {
    const { body: data } = await fetch({
      url: SERVER_URL + SERVER_INFO_URL,
      method: "GET",
    });
    //Example of a POST method request
    // const { body: { data = {} } = {} } = await fetch({
    //   url: 'https://xxx.com/api/xxx',
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     text: 'Hello Zepp OS'
    //   })
    // })
    console.log("log", data);
    const parsed = JSON.stringify(data);
    console.log("log", parsed);
    setInfo(parsed);
    resp = getInfo();
  } catch (error) {
    resp = "ERROR";
  } finally {
    const jsonResp = { data: { result: resp } };
    if (ctx != false) {
      ctx.response(jsonResp);
    } else {
      return jsonResp;
    }
  }
};

// const sendToWatch = async () => {
//   console.log("log", "sendToWatch");
//   const res = await fetchInfo();
//   messageBuilder.call(res);
// };

const fetchRaw = async (ctx, url) => {
  try {
    const { body: data } = await fetch({
      url: url,
      method: "GET",
    });
    console.log("log", data);

    //Example of a POST method request
    // const { body: { data = {} } = {} } = await fetch({
    //   url: 'https://xxx.com/api/xxx',
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     text: 'Hello Zepp OS'
    //   })
    // })
    ctx.response({
      data: { result: data },
    });
  } catch (error) {
    ctx.response({
      data: { result: "ERROR" },
    });
  }
};

AppSideService({
  onInit() {
    // timer1 = setInterval(sendToWatch, 1000);

    messageBuilder.listen(() => {});
    messageBuilder.on("request", (ctx) => {
      const jsonRpc = messageBuilder.buf2Json(ctx.request.payload);
      switch (jsonRpc.method) {
        case Commands.getInfo:
          return fetchInfo(ctx);
        case Commands.getImg:
          const { params = {} } = jsonRpc;
          const url = SERVER_URL + "get_img.php?" + params;
          return fetchRaw(ctx, url);

        default:
          break;
      }
    });
  },

  onRun() {},
  onDestroy() {},
});
