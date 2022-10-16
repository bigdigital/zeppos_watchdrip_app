export function gotoSubpage(page, params) {
  if (!params) params = {};

  let url = "page/index";
  if (page.indexOf(".") !== -1) {
    let r = page.split(".");
    url = "page/" + r[0];
    page = r[1];
  }

  hmApp.gotoPage({
    url: url,
    param: JSON.stringify({
      page,
      ...params,
    }),
  });

  return 1;
}
