const { classes: Cc, interfaces: Ci, utils: Cu } = Components;;
var TapTranslate, Translation, install, requestBuilder, shutdown, startup, uninstall, utils, windowListener, HTMLParser;

Cu["import"]("resource://gre/modules/Services.jsm");

TapTranslate = {
  _prefsBranch: "extensions.taptranslate.",
  _prefs: null,
  _contextMenus: [],
  init: function(addonData) {
    this.addonData = addonData;
    this._setDefaultPrefs();
    return this._prefs = Services.prefs.getBranch(this._prefsBranch);
  },
  uninit: function() {
    return this._prefs = null;
  },
  setTranslationLanguage: function(language) {
    return this._prefs.setCharPref("translation_language", language);
  },
  showTranslatedLanguage: function() {
    return this._prefs.getBoolPref("show_translated_language");
  },
  _setDefaultPrefs: function() {
    var prefs;
    prefs = Services.prefs.getDefaultBranch(this._prefsBranch);
    prefs.setCharPref("translation_language", "en");
    return prefs.setBoolPref("show_translated_language", false);
  },
  install: function() {},
  uninstall: function() {},
  load: function(aWindow) {
    if (!aWindow) {
      return;
    }
    return this.setupUI(aWindow);
  },
  unload: function(aWindow) {
    if (!aWindow) {
      return;
    }
    return this.cleanupUI(aWindow);
  },
  setupUI: function(aWindow) {
    var action, label, translate;
    label = utils.t("Translate");
    translate = (function(_this) {
      return function(aElement) {
        var text;
        text = utils.getSelectedText(aWindow);
        aWindow.SelectionHandler._closeSelection();
        return _this._translate(aWindow, text);
      };
    })(this);
    action = {
      label: label,
      id: "translate",
      icon: this.addonData.resourceURI.spec + "assets/translate.png",
      action: translate,
      showAsAction: false,
      order: 0
    };
    if (aWindow.ActionBarHandler != null) {
      aWindow.ActionBarHandler.actions.TRANSLATE = Object.assign({}, action, {
        selector: aWindow.ActionBarHandler.actions.COPY.selector
      });
    }
    if (aWindow.SelectionHandler != null) {
      return aWindow.SelectionHandler.addAction(Object.assign({}, action, {
        selector: aWindow.SelectionHandler.actions.COPY.selector
      }));
    }
  },
  cleanupUI: function(aWindow) {
    return aWindow.SelectionHandler.removeAction("TRANSLATE");
  },
  _translate: function(aWindow, text) {
    var request, translationLanguage;
    translationLanguage = this._prefs.getCharPref("translation_language");
    request = requestBuilder.build(text, translationLanguage, (function(_this) {
      return function(event) {
        var translation;
        //translation = JSON.parse(event.target.responseText.replace(/,+/g, ','));
	response = event.target.responseText;
	//aWindow.NativeWindow.toast.show(response,"short");
	//var DOMPars = HTMLParser(response.trim());
	//translation = DOMPars.getElementByTagName('meta')[1].innerHTML;
	//var doc = document.implementation.createHTMLDocument("example");
	//doc.documentElement.innerHTML = response;
	//translation = doc.getElementByTagName('meta')[2].innerHTML;
	
aWindow.NativeWindow.toast.show(response,"short");
	var startIndex = response.indexOf("description")+text.length+34;
	var endIndex = response.indexOf("keywords")-16;
	translation = response.substring(startIndex,endIndex);
        return _this._showTranslation(aWindow, translation);
      };
    })(this), (function(_this) {
      return function() {
        return _this._translationErrorNotify(aWindow);
      };
    })(this));
    return request.send();
  },
  _showTranslation: function(aWindow, translation) {
    translation = new Translation(translation);
    return translation.show(aWindow);
  },
  _translationErrorNotify: function(aWindow) {
    var msg;
    msg = utils.t("TranslationRequestError");
    return aWindow.NativeWindow.toast.show(msg);
  }
};

Translation = (function() {
  function Translation(response) {
    this.response = response;
  }

  Translation.prototype.show = function(aWindow) {
    return aWindow.NativeWindow.doorhanger.show(this.response, "Translation", [
      {
        label: utils.t("Copy"),
        callback: (function(_this) {
          return function() {
            _this._copyToClipboard();
            return aWindow.NativeWindow.toast.show(utils.t("TranslationCopied"), "short");
          };
        })(this)
      }, {
        label: utils.t("Close"),
        callback: function() {},
        positive: true
      }
    ]);
  };

  Translation.prototype.main = function() {
    if (this.response[0] == null) {
      return;
    }
    return this._main || (this._main = this.response[0].filter(function(part) {
      return part[0] != null;
    }).map(function(part) {
      return part[0];
    }).join(""));
  };

  Translation.prototype.secondary = function() {
    if (!Array.isArray(this.response[1])) {
      return;
    }
    return this._secondary || (this._secondary = this.response[1].filter(function(part) {
      return (part[0] != null) && (part[1] != null);
    }).map(function(part) {
      return part[0] + ": " + (part[1].join(", "));
    }).join("; "));
  };

  Translation.prototype.source = function() {
    var lang;
    lang = Array.isArray(this.response[1]) ? this.response[2] : this.response[1];
    return utils.t(lang);
  };

  Translation.prototype._message = function() {
    var msg;
    msg = "";
    if (TapTranslate.showTranslatedLanguage()) {
      msg += this.source();
      msg += "; ";
    }
    msg += this.main();
    if (this.secondary()) {
      msg += "; ";
      msg += this.secondary();
    }
    return msg;
  };

  Translation.prototype._copyToClipboard = function() {
    return utils.copyToClipboard(this.main());
  };

  return Translation;

})();

requestBuilder = {
  //url: "https://translate.google.com/translate_a/single",
  url: "http://yourdictionary.com/",

  createXMLHttpRequest: function(params) {
    return Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
  },
  build: function(text, translationLanguage, successHandler, errorHandler) {
    /*var param, params, query, request, url, value;
    params = {
      client: "t",
      hl: "auto",
      sl: "auto",
      dt: ["bd", "t"],
      tk: (utils.randomNumber(100000, 1000000)) + "|" + (utils.randomNumber(10000, 100000)),
      tl: translationLanguage,
      q: text
    };
    query = [];
    for (param in params) {
      value = params[param];
      if (Array.isArray(value)) {
        value.forEach(function(v) {
          return query.push(param + "=" + (encodeURIComponent(v)));
        });
      } else {
        query.push(param + "=" + (encodeURIComponent(value)));
      }
    }
    query = query.join("&");*/
    //url = this.url + "?" + query;
    url = this.url + encodeURIComponent(text);
    request = this.createXMLHttpRequest();
    request.open("GET", url);
    //request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    request.addEventListener("load", successHandler, false);
    request.addEventListener("error", errorHandler, false);
    return request;
  }
};

utils = {
  _translations: null,
  _translationsUri: "chrome://taptranslate/locale/taptranslate.properties",
  t: function(name) {
    this._translations || (this._translations = Services.strings.createBundle(this._translationsUri));
    try {
      return this._translations.GetStringFromName(name);
    } catch (_error) {
      return name;
    }
  },
  getSelectedText: function(aWindow) {
    var selection, win;
    win = aWindow.BrowserApp.selectedTab.window;
    selection = win.getSelection();
    if (!selection || selection.isCollapsed) {
      return "";
    }
    return selection.toString().trim();
  },
  capitalize: function(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  },
  copyToClipboard: function(text) {
    this._clipboardHelper || (this._clipboardHelper = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper));
    return this._clipboardHelper.copyString(text);
  },
  randomNumber: function(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
};

install = function(aData, aReason) {
  return TapTranslate.install();
};

uninstall = function(aData, aReason) {
  if (aReason === ADDON_UNINSTALL) {
    return TapTranslate.uninstall;
  }
};

startup = function(aData, aReason) {
  var win, windows;
  TapTranslate.init(aData);
  windows = Services.wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    win = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    if (win) {
      TapTranslate.load(win);
    }
  }
  return Services.wm.addListener(windowListener);
};

shutdown = function(aData, aReason) {
  var win, windows;
  if (aReason === APP_SHUTDOWN) {
    return;
  }
  Services.wm.removeListener(windowListener);
  windows = Services.wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    win = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    if (win) {
      TapTranslate.unload(win);
    }
  }
  return TapTranslate.uninit();
};

windowListener = {
  onOpenWindow: function(aWindow) {
    var win;
    win = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
    return win.addEventListener("UIReady", function() {
      win.removeEventListener("UIReady", arguments.callee, false);
      return TapTranslate.load(win);
    }, false);
  },
  onCloseWindow: function() {},
  onWindowTitleChange: function() {}
};
