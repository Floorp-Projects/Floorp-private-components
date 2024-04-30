/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*- */

export const gSplitView = {
  Functions: {
    init() {
      gSplitView.Functions.tabContextMenu.addContextMenuToTabContext();
      Services.prefs.setBoolPref("floorp.browser.splitView.working", false);
    },
    setSplitView(tab, side) {
      try {
        this.removeSplitView();
      } catch (e) {}
      Services.prefs.setBoolPref("floorp.browser.splitView.working", true);

      let panel = gSplitView.Functions.getlinkedPanel(tab.linkedPanel);
      let browser = tab.linkedBrowser;
      let browserDocShellIsActiveState = browser.docShellIsActive;

      // Check if the a tab is already in split view
      let tabs = window.gBrowser.tabs;
      for (let i = 0; i < tabs.length; i++) {
        if (tabs[i].hasAttribute("splitView")) {
          gSplitView.Functions.removeSplitView(tabs[i]);
        }
      }

      let CSSElem = document.getElementById("splitViewCSS");
      if (!CSSElem) {
        let elem = document.createElement("style");
        elem.setAttribute("id", "splitViewCSS");
        elem.textContent = `
        #tabbrowser-tabpanels > * {
          flex: 0;
        }
        
        .deck-selected {
          flex: 1 !important;
          order: 1 !important;
        }
        
        .deck-selected[splitview="right"] {
          order: 3 !important;
        }
        
        .deck-selected[splitview="left"] {
          order: 0 !important;
        }
        
        #tabbrowser-tabpanels {
          display: flex !important;
        }
        `;
        document.head.appendChild(elem);
      }

      tab.setAttribute("splitView", true);
      panel.setAttribute("splitview", side);
      panel.setAttribute("splitviewtab", true);
      panel.classList.add("deck-selected");

      if (!browserDocShellIsActiveState) {
        browser.docShellIsActive = true;
      }

      gSplitView.Functions.setRenderLayersEvent();
    },

    removeSplitView() {
      Services.prefs.setBoolPref("floorp.browser.splitView.working", false);

      let tab = document.querySelector(`.tabbrowser-tab[splitView="true"]`);

      if (!tab) {
        return;
      }

      // remove style
      let panel = gSplitView.Functions.getlinkedPanel(tab.linkedPanel);
      let CSSElem = document.getElementById("splitViewCSS");
      CSSElem?.remove();

      tab.removeAttribute("splitView");
      panel.removeAttribute("splitview");
      panel.removeAttribute("splitviewtab");
      panel.classList.remove("deck-selected");

      if (window.browser.docShellIsActive) {
        window.browser.docShellIsActive = false;
      }

      gSplitView.Functions.removeRenderLayersEvent();

      // set renderLayers to true & Set class to deck-selected
      window.gBrowser.selectedTab = tab;
    },

    getlinkedPanel(id) {
      let panel = document.getElementById(id);
      return panel;
    },

    setRenderLayersEvent() {
      document.addEventListener("floorpOnLocationChangeEvent", function () {
        gSplitView.Functions.handleTabEvent();
      });
    },

    removeRenderLayersEvent() {
      document.removeEventListener("floorpOnLocationChangeEvent", function () {
        gSplitView.Functions.handleTabEvent();
      });
    },

    handleTabEvent() {
      if (!Services.prefs.getBoolPref("floorp.browser.splitView.working")) {
        return;
      }

      let currentSplitViewTab = document.querySelector(
        `.tabbrowser-tab[splitView="true"]`
      );
      let currentSplitViewPanel = gSplitView.Functions.getlinkedPanel(
        currentSplitViewTab?.linkedPanel
      );
      let currentSplitViewBrowser = currentSplitViewTab?.linkedBrowser;

      if (!currentSplitViewBrowser) {
        return;
      }

      // set renderLayers to true & Set class to deck-selected
      currentSplitViewBrowser.renderLayers = true;
      currentSplitViewPanel?.classList.add("deck-selected");

      if (!currentSplitViewBrowser.docShellIsActive) {
        currentSplitViewBrowser.docShellIsActive = true;
      }

      function applySplitView() {
        currentSplitViewBrowser.renderLayers = true;
        currentSplitViewPanel?.classList.add("deck-selected");

        if (!window.browser.docShellIsActive) {
          window.browser.docShellIsActive = true;
        }
      }

      (function modifyDeckSelectedClass() {
        let tabs = window.gBrowser.tabs;
        for (let i = 0; i < tabs.length; i++) {
          let panel = gSplitView.Functions.getlinkedPanel(tabs[i].linkedPanel);
          if (
            tabs[i].hasAttribute("splitView") ||
            tabs[i] == window.gBrowser.selectedTab
          ) {
            panel?.classList.add("deck-selected");
          } else {
            panel?.classList.remove("deck-selected");
          }
        }
      })();

      window.setTimeout(applySplitView, 1000);
    },

    tabContextMenu: {
      addContextMenuToTabContext() {
        let beforeElem = document.getElementById("context_selectAllTabs");
        let menuitemElem = window.MozXULElement.parseXULToFragment(`
               <menu id="context_splitView" data-l10n-id="floorp-split-view-menu" accesskey="D">
                   <menupopup id="splitViewTabContextMenu"
                              onpopupshowing="gSplitView.Functions.tabContextMenu.onPopupShowing(event);"/>
               </menu>
               <menuitem id="splitViewTabContextMenuClose" data-l10n-id="splitview-close-split-tab"  oncommand="gSplitView.Functions.removeSplitView();"/>
               `);
        beforeElem.before(menuitemElem);
      },

      onPopupShowing(event) {
        //delete already exsist items
        let menuElem = document.getElementById("splitViewTabContextMenu");
        while (menuElem.firstChild) {
          menuElem.firstChild.remove();
        }

        //Rebuild context menu
        if (event.target === window.gBrowser.selectedTab) {
          let menuItem = window.MozXULElement.parseXULToFragment(`
                   <menuitem data-l10n-id="workspace-context-menu-selected-tab" disabled="true"/>
                  `);
          let parentElem = document.getElementById("workspaceTabContextMenu");
          parentElem.appendChild(menuItem);
          return;
        }

        let menuItem = window.MozXULElement.parseXULToFragment(`
                  <menuitem id="splitViewTabContextMenuLeft" data-l10n-id="splitview-show-on-left"  oncommand="gSplitView.Functions.setSplitView(TabContextMenu.contextTab, 'left');"/>
                  <menuitem id="splitViewTabContextMenuRight" data-l10n-id="splitview-show-on-right" oncommand="gSplitView.Functions.setSplitView(TabContextMenu.contextTab, 'right');"/>
                `);

        let parentElem = document.getElementById("splitViewTabContextMenu");
        parentElem.appendChild(menuItem);
      },

      setSplitView(event, side) {
        let tab = event.target;
        gSplitView.Functions.setSplitView(tab, side);
      },
    },
  },
};

gSplitView.Functions.init();
