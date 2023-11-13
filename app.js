import {LocalStorage} from "@zos/storage";

App({
        globalData: {
            localStorage: null,
            messaging: null,
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
);
