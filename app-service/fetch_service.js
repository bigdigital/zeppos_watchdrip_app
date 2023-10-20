import { log } from "@zos/utils";
import * as appServiceMgr from "@zos/app-service";
import { Time } from "@zos/sensor";



const timeSensor = new Time();

const logger = log.getLogger("time.service");


AppService({
    onEvent(e) {
        logger.log(`service onEvent(${e})`);
        let result = parseQuery(e);
        if (result.action === "exit") {
            appServiceMgr.exit();
        }
    },
    onInit(e) {
        logger.log(`service onInit(${e})`);

        timeSensor.onPerMinute(() => {
            logger.log(
                `${moduleName} time report: ${timeSensor.getHours()}:${timeSensor.getMinutes()}:${timeSensor.getSeconds()}`
            );
            sendNotification();
        });
    },
    onDestroy() {
        logger.log("service on destroy invoke");
    },
});