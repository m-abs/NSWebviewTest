import view = require("ui/core/view");
import pages = require("ui/page");

import {MyWebView} from '../../xml-declaration/my-web-view/my-web-view';

import {openUrl} from 'utils/utils';

const playerRegExp = /m\.e17\.dk\/embedded\/#book-player\?book\=([0-9a-z]*)/i;

import {WebViewInterface} from 'nativescript-webview-interface';
let oWebViewInterface: WebViewInterface;

export function pageLoaded(args) {
  console.log(">>> login-page.pageLoaded", args);
  const page = args.object;

  const webView = <MyWebView>view.getViewById(page, 'webview');
  if (webView.android) {
    webView.android.getSettings().setDomStorageEnabled(true);
  }
  oWebViewInterface = new WebViewInterface(webView);

  webView.on("loadFinished", (e) => {
    return;
    console.log('loadFinishedEvent', e);

    oWebViewInterface.callJSFunction('lytHandleEvent',['play-time-update', page.bindingContext.bookId, 0], function(result) {
      console.log('response from lytHandleEvent', result);
    });
  });
};

export function pageNavigatingTo(args) {
  console.log('player: pageNavigatingTo');
  const page = args.object;
  page.bindingContext = page.navigationContext;
};

export function onShowingModally(args) {
    console.log(">>> login-page.onShowingModally", args);
}

export function onShownModally(args: pages.ShownModallyData) {
    console.log(">>> login-page.onShownModally, context: " + args.context);
}

