import view = require("ui/core/view");

import {MyWebView} from './xml-declaration/my-web-view';

let webView: MyWebView;

export function pageLoaded(args) {
    var page = args.object;

    webView = <MyWebView>view.getViewById(page, 'webview');
    webView.urlOverrideHandler = (url: string) => {
      let res = url.match(/\bmadforandrer\.dk/i);

      return !res;
    };
}
