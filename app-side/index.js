import {MessageBuilder} from "../shared/message";
import {Commands, SERVER_INFO_URL, SERVER_URL,} from "../utils/config/constants";

// const logger = DeviceRuntimeCore.HmLogger.getLogger("watchdrip_side");
const messageBuilder = new MessageBuilder();

const fetchInfo = async (ctx, url) => {
    let resp = {};

    await fetch({
        url: url,
        method: "GET",
    })
        .then((response) => {
            if (!response.body)
                throw Error('No Data')

            return response.body
        })
        .then((data) => {
            try {
                console.log("log", data);
                const parsed = JSON.stringify(data);
                console.log("log", parsed);
                resp = parsed;
            } catch (error) {
                throw Error(error.message)
            }
        })
        .catch(function (error) {
            resp = {error: true, message: error.message};
        })
        .finally(() => {
                const jsonResp = {data: {result: resp}};
                if (ctx !== false) {
                    ctx.response(jsonResp);
                } else {
                    return jsonResp;
                }
            }
        )
};

const sendToWatch = async () => {
    console.log("log", "sendToWatch");
    const result = await fetchInfo();
    messageBuilder.call(result);
};

const fetchRaw = async (ctx, url) => {
    try {
        const {body: data} = await fetch({
            url: url,
            method: "GET",
        });
        console.log("log", data);
        ctx.response({
            data: {result: data},
        });
    } catch (error) {
        ctx.response({
            data: {result: "ERROR"},
        });
    }
};

AppSideService({
    onInit() {
        // timer1 = setInterval(sendToWatch, 1000);

        messageBuilder.listen(() => {
        });
        messageBuilder.on("request", (ctx) => {
            const jsonRpc = messageBuilder.buf2Json(ctx.request.payload);
            const {params = {}} = jsonRpc;
            let url = SERVER_URL;
            switch (jsonRpc.method) {
                case Commands.getInfo:
                    return fetchInfo(ctx, url + SERVER_INFO_URL + "?" + params);
                case Commands.getImg:
                    return fetchRaw(ctx, url + "get_img.php?" + params);
                case Commands.putTreatment:
                    return fetchRaw(ctx, url + SERVER_PUT_TREATMENTS_URL + "?" + params);
                default:
                    break;
            }
        });
    },

    onRun() {
    },
    onDestroy() {
    },
});
