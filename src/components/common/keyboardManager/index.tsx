import React, { useEffect } from "react";
import { KeyboardRegistrationManager } from "./keyboardRegistrationManager";

export enum KeyEventType {
  KeyDown = "keydown",
  KeyUp = "keyup",
  KeyPress = "keypress",
}

export const KeyboardContext = React.createContext<IKeyboardContext | null>(
  null
);

export interface IKeyboardContext {
  keyboard: KeyboardRegistrationManager;
}

const nonSupportedKeys = new Set(["Meta", "Ctrl", " Control", "Alt"]);
const inputElementTypes = new Set(["input", "select", "textarea"]);

function getKeyParts(evt: KeyboardEvent) {
  const keyParts = [];
  if (evt.shiftKey) {
    keyParts.push("Shift+");
  }
  if (evt.ctrlKey || evt.metaKey) {
    keyParts.push("CmdOrCtrl+");
  }
  if (evt.altKey) {
    keyParts.push("Alt+");
  }
  keyParts.push(evt.key);
  return keyParts.join("");
}

function isDisabled(): boolean {
  return (
    !!document.activeElement &&
    inputElementTypes.has(document.activeElement.tagName.toLowerCase())
  );
}

export const KeyboardManager: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const keyboard = new KeyboardRegistrationManager();
  const contextValue = { keyboard };

  useEffect(() => {
    const onKeyboardEvent = (evt: KeyboardEvent) => {
      if (isDisabled() || nonSupportedKeys.has(evt.key)) {
        return;
      }
      keyboard.invokeHandler(evt.type as KeyEventType, getKeyParts(evt), evt);
    };

    window.addEventListener(KeyEventType.KeyDown, onKeyboardEvent);
    window.addEventListener(KeyEventType.KeyUp, onKeyboardEvent);
    window.addEventListener(KeyEventType.KeyPress, onKeyboardEvent);

    return () => {
      window.removeEventListener(KeyEventType.KeyDown, onKeyboardEvent);
      window.removeEventListener(KeyEventType.KeyUp, onKeyboardEvent);
      window.removeEventListener(KeyEventType.KeyPress, onKeyboardEvent);
    };
  }, [keyboard]);

  return (
    <KeyboardContext.Provider value={contextValue}>
      {children}
    </KeyboardContext.Provider>
  );
};
