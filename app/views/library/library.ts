import view = require("ui/core/view");
import application = require("application");

import {MyWebView} from 'my-web-view';
import {WebViewInterface} from 'nativescript-webview-interface';
import {StackLayout} from 'ui/layouts/stack-layout';

import {openUrl} from 'utils/utils';
import uibuilder = require("ui/builder");

import frameModule = require("ui/frame");

const webView: MyWebView = uibuilder.load({
  path: '~/xml-declaration/my-web-view',
  name: 'MyWebView'
});

let oWebViewInterface: WebViewInterface;
let webViewInited = false;

/*
 * Overriding default create/remove behavior.
 *
 * By default the native WebView is destroyed on pageUnloaded and recreated on pageLoaded.
 * This destroyes browser history.
 *
 */
let oldCreateFn = webView._createUI;
webView._createUI = function() {
  console.log('_createUI');

  if (!webViewInited) {
    oldCreateFn.call(webView);

    oWebViewInterface = new WebViewInterface(webView);

    // WebViewInterface unbinds a few properties on 'unloaded', prevent that.
    webView.off('unloaded');

    webViewInited = true;
  } else {
    // The webview triggers a property-change on src/url, so the page is reloaded.
    // Temporary suspend loading
    this._suspendLoading = true;
  }
};

webView._clearAndroidReference = function() {
  console.log('fuck it, just override this', this);
};

// Is the page active?
let pageActive = false;

// RegExp for audiobook player URLs.
const playerRegExp = /m\.e17\.dk\/embedded\/#book-player\?book\=([0-9a-z]*)/i;

// Should we prevent the WebView from loading a URL and handle it our selves?
webView.urlOverrideHandler = (url: string) => {
  // Check if this is a audiobook URL?
  const matchPlayer = url.match(playerRegExp);
  if (matchPlayer) {
    // Open the player
    console.log(`player_url: ${url}`, matchPlayer);
    const navigationEntry = {
      moduleName: 'views/player/player',
      context: {
        bookId: Number(matchPlayer[1])
      }
    };

    frameModule.topmost().navigate(navigationEntry);

    return true;
  }

  // This this an external URL?
  const external = !url.match(/\bnota\.dk/i);
  if (external) {
    // Yes, open it in the system browser
    console.log(`external: ${url}`);
    openUrl(url);

    return true;
  }

  // Don't override URL loading
  console.log('internal:', url);

  return false;
};

if (application.android) {
  // Override android's back button and handle back in the WebView
  application.android.on(application.AndroidApplication.activityBackPressedEvent, function(args) {
    console.log("Event: " + args.eventName + ", Activity: " + args.activity, pageActive);
    if (!pageActive) {
      // Page isn't active, don't cancel the event
      return;
    }

    // Set args.cancel = true to cancel back navigation and do something custom.
    if (webView.canGoBack) {
      args.cancel = true;
      webView.goBack();
    }
  });
}

export function pageLoaded({object: page}) {
  console.log('pageLoaded');

  // Reenable URL Loading
  webView._suspendLoading = false;

  if (!webView.parent) {
    // WebView haven't been added to the page yet, do it now.
    const stackLayout: StackLayout = <StackLayout>view.getViewById(page, 'layout');

    stackLayout.insertChild(webView, 0);

    if (!webView.url) {
      webView.url = 'https://nota.dk/bibliotek';
    }
  }

  pageActive = true;
};

export function pageUnloaded({object: page}) {
  console.log('pageUnloaded');

  // Page is now inactive, this disables the back-event
  pageActive = false;
};
