/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*- */

const CustomKeyboardShortcutUtils = ChromeUtils.importESModule(
  "resource:///modules/CustomKeyboardShortcutUtils.sys.mjs",
);

/** Floorp's custom functions used for custom actions */
export const gFloorpCustomActionFunctions = {
  evalCustomeActionWithNum(num) {
    let action = Services.prefs.getStringPref(
      `floorp.custom.shortcutkeysAndActions.customAction${num}`,
    );
    Function(action)();
  },
};

/** 
 * Floorp's custom functions used for CSK
 * If you need add actions for CSK, you can add it here.
 */

export const gFloorpCSKActionFunctions = {
  PictureInPicture: {
    // PictureInPicture.onCommand only works if browser is focused.
    // So, we need to focus the browser window after calling PictureInPicture.onCommand.
    togglePictureInPicture(event) {
      window.PictureInPicture.onCommand(event);
      window.setTimeout(() => {
        window.focus();
      }, 500);
    }
  }
}

export const gFloorpCustomShortcutKeys = {
  init() {
    let webPanelId = new URL(window.location.href).searchParams.get("floorpWebPanelId");
    if (webPanelId) {
        return;
    }

    Services.prefs.clearUserPref(
      CustomKeyboardShortcutUtils.SHORTCUT_KEY_CHANGED_ARRAY_PREF,
    );

    if (
      Services.prefs.getBoolPref(
        CustomKeyboardShortcutUtils.SHORTCUT_KEY_DISABLE_FX_DEFAULT_SCKEY_PREF,
        false,
      )
    ) {
      window.SessionStore.promiseInitialized.then(() => {
        gFloorpCustomShortcutKeys.disableAllCustomKeyShortcut();
        console.info("Remove already exist shortcut keys");
      });
    }

    const keyboradShortcutConfig = JSON.parse(
      Services.prefs.getStringPref(
        CustomKeyboardShortcutUtils.SHORTCUT_KEY_AND_ACTION_PREF,
        "",
      ),
    );

    if (
      keyboradShortcutConfig.length === 0 &&
      CustomKeyboardShortcutUtils.SHORTCUT_KEY_AND_ACTION_ENABLED_PREF
    ) {
      return;
    }

    for (let shortcutObj of keyboradShortcutConfig) {
      let actionName = shortcutObj.actionName;
      let key = shortcutObj.key;
      let keyCode = shortcutObj.keyCode;
      let modifiers = shortcutObj.modifiers;

      if ((key && actionName) || (keyCode && actionName)) {
        gFloorpCustomShortcutKeys.buildShortCutkeyFunction(
          actionName,
          key,
          keyCode,
          modifiers,
        );
      } else {
        console.error("Invalid shortcut key config: " + shortcutObj);
      }
    }
  },

  buildShortCutkeyFunction(actionName, key, keyCode, modifiers) {
    let functionName =
      CustomKeyboardShortcutUtils.keyboradShortcutActions[actionName];
    if (!functionName) {
      return;
    }

    const functionCode = CustomKeyboardShortcutUtils.keyboradShortcutActions[actionName][0];

    // Remove " " from modifiers.
    modifiers = modifiers.replace(/ /g, "");

    let keyElement = window.MozXULElement.parseXULToFragment(`
            <key id="${actionName}" class="floorpCustomShortcutKey"
                 modifiers="${modifiers}"
                 key="${key}"
                 oncommand="${functionCode}"
             />
         `);

    if (keyCode) {
      keyElement = window.MozXULElement.parseXULToFragment(`
           <key id="${actionName}" class="floorpCustomShortcutKey"
                oncommand="${functionCode}"
                keycode="${keyCode}"
             />`);
    }

    document.getElementById("mainKeyset").appendChild(keyElement);
  },

  removeAlreadyExistShortCutkeys() {
    let mainKeyset = document.getElementById("mainKeyset");
    while (mainKeyset.firstChild) {
      mainKeyset.firstChild.remove();
    }
  },

  disableAllCustomKeyShortcut() {
    let keyElems = document.querySelector("#mainKeyset").childNodes;
    for (let keyElem of keyElems) {
      if (!keyElem.classList.contains("floorpCustomShortcutKey")) {
        keyElem.setAttribute("disabled", true);
      }
    }
  },

  disableAllCustomKeyShortcutElemets() {
    let keyElems = document.querySelectorAll(".floorpCustomShortcutKey");
    for (let keyElem of keyElems) {
      keyElem.remove();
    }
  },

  enableAllCustomKeyShortcutElemets() {
    let keyElems = document.querySelectorAll(".floorpCustomShortcutKey");
    for (let keyElem of keyElems) {
      keyElem.removeAttribute("disabled");
    }
  },

  removeCustomKeyShortcutElemets() {
    let keyElems = document.querySelectorAll(".floorpCustomShortcutKey");
    for (let keyElem of keyElems) {
      keyElem.remove();
    }
  },
};

gFloorpCustomShortcutKeys.init();
