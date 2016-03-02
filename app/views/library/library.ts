import view = require("ui/core/view");
import application = require("application");

import {MyWebView} from '../../xml-declaration/my-web-view/my-web-view';

import {openUrl} from 'utils/utils';

import frameModule = require("ui/frame");

let webView: MyWebView;

const playerRegExp = /m\.e17\.dk\/embedded\/#book-player\?book\=([0-9a-z]*)/i;

export function pageLoaded({object: page}) {
  console.log('pageLoaded', page, page.bindingContext, page.navigationContext);

  webView = <MyWebView>view.getViewById(page, 'webview');
  webView.urlOverrideHandler = (url: string) => {
    const matchPlayer = url.match(playerRegExp);
    if (matchPlayer) {
      console.log(`player_url: ${url}`, matchPlayer);
      const navigationEntry = {
        moduleName: 'views/player/player',
        context: {
          bookId: Number(matchPlayer[1])
        }
      };
      console.log(JSON.stringify(navigationEntry));

      frameModule.topmost().navigate(navigationEntry);

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

  if (application.android && false) {
    application.android.on(application.AndroidApplication.activityBackPressedEvent, function(args) {
      console.log("Event: " + args.eventName + ", Activity: " + args.activity, page.visibility);
      // Set args.cancel = true to cancel back navigation and do something custom.

      if (webView.canGoBack) {
        args.cancel = true;
        webView.goBack();
      }
    });
  };
};

export function pageNavigatingTo({object: page}, isBackNavigation: boolean) {
  console.log('onNavigatingTo', page, isBackNavigation);
};
