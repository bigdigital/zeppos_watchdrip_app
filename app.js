import {LocalStorage} from "@zos/storage";

App({
        globalData: {
            localStorage: null
        },
        onCreate(options) {
            this.globalData.localStorage = new LocalStorage();
            console.log("app on create invoke");
        },

        onDestroy(options) {
            console.log("app on destroy invoke");
        }
    }
);
