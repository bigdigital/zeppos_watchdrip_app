
import {LocalStorage} from "@zos/storage";
//import {BaseApp} from "@zeppos/zml/base-app";
//import {BaseApp} from "./core/device/base-app";
App(
    BaseApp(
        {
        globalData: {
            localStorage: null
        },
        onCreate(options) {
            this.globalData.localStorage = new LocalStorage();

           // this.globalData.messaging.disConnect();
            console.log("app on create invoke");
        },

        onDestroy(options) {
            console.log("app on destroy invoke");
        }
    }
    )
);
