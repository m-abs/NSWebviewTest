import view = require("ui/core/view");

import {MyWebView} from './xml-declaration/my-web-view/my-web-view';

import {openUrl} from 'utils/utils';

let webView: MyWebView;

const playerRegExp = /m\.e17\.dk\/embedded\/#book-player\?book\=([0-9a-z]*)/i;

export function pageLoaded(args) {
    var page = args.object;

    webView = <MyWebView>view.getViewById(page, 'webview');
    webView.urlOverrideHandler = (url: string) => {
      const matchPlayer = url.match(playerRegExp);
      if (matchPlayer) {
        console.log(`player_url: ${url}`, matchPlayer);

        return true;
      }

      const external = !url.match(/\bnota\.dk/i);
      if (external) {
        console.log(`external: ${url}`);
        openUrl(url);

        return true;
      }

      console.log('internal:', url);

      return false;
    };
}
