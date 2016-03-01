import definition = require("ui/web-view");
import view = require("ui/core/view");
import dependencyObservable = require("ui/core/dependency-observable");
import proxy = require("ui/core/proxy");
import * as utils from "utils/utils";
import * as trace from "trace";
import * as fileSystemModule from "file-system";

var fs: typeof fileSystemModule;
function ensureFS() {
    if (!fs) {
        fs = require("file-system");
    }
}

var urlProperty = new dependencyObservable.Property(
    "url",
    "MyWebView",
    new proxy.PropertyMetadata("")
    );

function onUrlPropertyChanged(data: dependencyObservable.PropertyChangeData) {
    var webView = <MyWebView>data.object;

    if (webView._suspendLoading) {
        return;
    }

    webView._loadUrl(data.newValue);
}

// register the setNativeValue callback
(<proxy.PropertyMetadata>urlProperty.metadata).onSetNativeValue = onUrlPropertyChanged;

var srcProperty = new dependencyObservable.Property(
    "src",
    "MyWebView",
    new proxy.PropertyMetadata("")
    );

function onSrcPropertyChanged(data: dependencyObservable.PropertyChangeData) {
    var webView = <MyWebView>data.object;

    if (webView._suspendLoading) {
        return;
    }

    webView.stopLoading();    

    var src = <string>data.newValue;
    trace.write("MyWebView._loadSrc(" + src + ")", trace.categories.Debug);

    if (utils.isFileOrResourcePath(src)) {
        ensureFS();

        if (src.indexOf("~/") === 0) {
            src = fs.path.join(fs.knownFolders.currentApp().path, src.replace("~/", ""));
        }

        if (fs.File.exists(src)) {
            var file = fs.File.fromPath(src);
            var content = file.readTextSync();
            webView._loadFileOrResource(src, content);
        }
    } else if (src.toLowerCase().indexOf("http://") === 0 || src.toLowerCase().indexOf("https://") === 0) {
        webView._loadHttp(src);
    } else {
        webView._loadData(src);
    }
}

// register the setNativeValue callback
(<proxy.PropertyMetadata>srcProperty.metadata).onSetNativeValue = onSrcPropertyChanged;

export interface urlOverrideHandlerFn {
  (url: String): boolean;
};

export abstract class MyWebView extends view.View implements definition.WebView {
    public static loadStartedEvent = "loadStarted";
    public static loadFinishedEvent = "loadFinished";

    public static urlProperty = urlProperty;
    public static srcProperty = srcProperty;

    public _suspendLoading: boolean;

    constructor() {
        super();
    }

    get url(): string {
        return this._getValue(MyWebView.urlProperty);
    }

    set url(value: string) {
        this._setValue(MyWebView.urlProperty, value);
    }

    get src(): string {
        return this._getValue(MyWebView.srcProperty);
    }

    set src(value: string) {
        this._setValue(MyWebView.srcProperty, value);
    }

    public _onLoadFinished(url: string, error?: string) {

        this._suspendLoading = true;
        this.url = url;
        this._suspendLoading = false;

        var args = <definition.LoadEventData>{
            eventName: MyWebView.loadFinishedEvent,
            object: this,
            url: url,
            error: error
        };

        this.notify(args);
    }

    public _onLoadStarted(url: string) {
        var args = <definition.LoadEventData>{
            eventName: MyWebView.loadStartedEvent,
            object: this,
            url: url,
            error: undefined
        };

        this.notify(args);
    }

    abstract _loadUrl(url: string): void;

    abstract _loadFileOrResource(path: string, content: string): void;

    abstract _loadHttp(src: string): void;

    abstract _loadData(src: string): void;

    abstract stopLoading(): void;

    get canGoBack(): boolean {
        throw new Error("This member is abstract.");
    }

    get canGoForward(): boolean {
        throw new Error("This member is abstract.");
    }

    abstract goBack(): void;

    abstract goForward(): void;

    abstract reload(): void;

    protected _urlOverrideHandler: urlOverrideHandlerFn;

    set urlOverrideHandler(fn: urlOverrideHandlerFn) {
      this._urlOverrideHandler = fn;
    };

    get urlOverrideHandler(): urlOverrideHandlerFn {
      return this._urlOverrideHandler;
    };
} 
