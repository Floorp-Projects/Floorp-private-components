/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*- */

var { BrowserManagerSidebarPanelWindowUtils } = ChromeUtils.importESModule(
    "resource:///modules/BrowserManagerSidebarPanelWindowUtils.sys.mjs"
);

// global variables
var gBrowser = window.gBrowser;

var gBmsWindow = {
    _initialized: false,
    currentURL: new URL(window.location.href),

    get mainWindow() {
        return document.getElementById("main-window");
    },

    get loadURL() {
        return this.webapnelData.url;
    },

    get webpanelId() {
        return this.currentURL.searchParams.get("floorpWebPanelId");
    },

    get userContextId() {
        return this.webapnelData.usercontext ? this.webapnelData.usercontext : 0;
    },

    get userAgent() {
        return this.webapnelData?.userAgent ? this.webapnelData.userAgent : false;
    },

    get webapnelData() {
        let id = this.webpanelId;
        let data = BrowserManagerSidebarPanelWindowUtils.BROWSER_SIDEBAR_DATA.data;
        return data[id];
    },

    init() {
        if (this._initialized) {
            return;
        }

        let webPanelId = new URL(window.location.href).searchParams.get("floorpWebPanelId");
        if (!webPanelId) {
            return;
        }

        // Against session restore issue
        window.floorpWebPanelWindow = true;

        document.addEventListener("DOMContentLoaded", () => {
            window.SessionStore.promiseInitialized.then(() => {
                this.createWebpanelWindow();
            });
        });
        
        // finish initialization
        this._initialized = true;
    },

    createWebpanelWindow() {
        let webPanelId = this.currentURL.searchParams.get("floorpWebPanelId");
        let userContextId = this.userContextId;
        let userAgent = this.userAgent;
        let loadURL = this.loadURL;

        this.mainWindow.setAttribute("BSM-window", "true");
        this.mainWindow.setAttribute("BMS-usercontextid", userContextId);
        this.mainWindow.setAttribute("BMS-useragent", userAgent);
        this.mainWindow.setAttribute("BMS-webpanelid", webPanelId);
        window.bmsLoadedURI = loadURL;

        // Remove "navigator:browser" from window-main attribute
        this.mainWindow.setAttribute("windowtype", "navigator:webpanel");

        // Tab modifications
        gBrowser.loadURI(Services.io.newURI(loadURL), {
            triggeringPrincipal:
                Services.scriptSecurityManager.getSystemPrincipal(),
        });

        // Atribute modifications
        gBrowser.selectedTab.setAttribute("BMS-webpanel-tab", "true");

        // userContextId
        if (userContextId != 0) {
            window.setTimeout(() => {
                BrowserManagerSidebarPanelWindowUtils.reopenInSelectContainer(
                    window,
                    webPanelId,
                    userContextId,
                    false
                );
            }, 0);
        }

        // Resolve the issue that open url by anoter application and that is not loaded on main window.
        window.setTimeout(() => {
            let tab = window.gBrowser.addTrustedTab("about:blank");
            window.gBrowser.removeTab(tab);
        }, 0);


        // Windows moficiations
        this.mainWindow
            .setAttribute(
                "chromehidden",
                "toolbar",
                "menubar directories extrachrome chrome,location=yes,centerscreen,dialog=no,resizable=yes,scrollbars=yes",
            );

        const BMSSyleElement = document.createElement("style");
        BMSSyleElement.textContent = `
           @import url("chrome://browser/content/browser-bms-window.css");
        `;
        document.head.appendChild(BMSSyleElement);

        window.setInterval(() => {
            gBmsWindow.setZoomLevel();
        }, 100);
    },

    setZoomLevel() {
        let zoomLevel = gBmsWindow.webapnelData.zoomLevel;
        if (zoomLevel) {
            window.ZoomManager.zoom = zoomLevel;
        }
    }
};

if (Services.prefs.getBoolPref("floorp.browser.sidebar2.addons.enabled")) {
    gBmsWindow.init();
}
