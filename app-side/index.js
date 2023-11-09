import {Commands, SERVER_INFO_URL, SERVER_URL,} from "../utils/config/constants";
import {BaseSideService} from "../core/side";

const fetchInfo = async (res, url) => {
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
                // const parsed = JSON.stringify(data);
                // console.log("log", parsed);
                //resp = typeof data === 'string' ? JSON.parse(data) : data
                resp = data;
            } catch (error) {
                throw Error(error.message)
            }
        })
        .catch(function (error) {
            resp = {error: true, message: error.message};
        })
        .finally(() => {
                const jsonResp = {result: resp};
                res(null,jsonResp);
            }
        )
};


AppSideService(
    BaseSideService({
        onInit() {
        },
        onRequest(req, res) {

            console.log("log", req);

            let url = SERVER_URL;
            const {params = {}} = req;

            switch (req.method) {
                case Commands.getInfo:
                    return fetchInfo(res, url + SERVER_INFO_URL + "?" + params);
                case Commands.getImg:

                case Commands.putTreatment:

                default:
                    break;
            }
        },
        onRun() {
        },

        onDestroy() {
        },
    })
);
