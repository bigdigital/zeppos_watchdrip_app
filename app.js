import "./shared/device-polyfill";
import { MessageBuilder } from "./shared/message";
import { WATCHDRIP_APP_ID } from "./utils/config/global-constants";

const appId = WATCHDRIP_APP_ID;
const messageBuilder = new MessageBuilder({ appId });
App({
  globalData: {
    messageBuilder: messageBuilder,
  },
  onCreate(options) {
    console.log("app on create invoke");
    //messageBuilder.connect();
  },

  onDestroy(options) {
    console.log("app on destroy invoke");
    //messageBuilder.disConnect();
  },
});
