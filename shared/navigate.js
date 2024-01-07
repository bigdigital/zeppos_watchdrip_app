/*
* will open the app
* @appid  if  defined will open the app with id
* @page defines the page. Can be used as page_name.subpage  , this will set url as page/page_name and add param "subpage"
* or it is also possible to use "subpage", in this case would be used default url 'page/index'
* @params additional params which would be added
 */

import { back,launchApp,push } from '@zos/router'

export const GoBackType = {NONE: 'none', GO_BACK: 'go_back'};

export function gotoSubpage(page, params, appid) {
    if (!params) params = {};

    let url = 'page/index'
    if (page.indexOf('.') !== -1) {
        let r = page.split('.')
        url = 'page/' + r[0]
        page = r[1]
    }

    let obj = {
        url: url,
        params: JSON.stringify({
            page, ...params
        })
    }
    if (appid) {
        obj = {...obj, appid: appid}
        launchApp(obj)
    } else {
        push(obj);
    }
}

export function handleGoBack(goBackType) {
    switch (goBackType) {
        case GoBackType.NONE:
            break;
        case GoBackType.GO_BACK:
            back();
            break;
    }
}
