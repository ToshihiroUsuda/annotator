import React, { useState, useContext } from "react";
import { strings } from "../../common/strings";
import {
  IKeyboardBindingProps,
  KeyboardBinding,
} from "../common/keyboardBinding";
import { KeyboardContext, KeyEventType } from "../common/keyboardManager";
import MessageBox from "../common/messageBox";

export interface IHelpMenuProps {
  onClose?: () => void;
}

export const HelpMenu = (props: IHelpMenuProps) => {
  const context = useContext(KeyboardContext);
  const [show, setShow] = useState(false);
  const icon: string = "fa-question-circle";

  const onClose = () => {
    setShow(false);
    if (props.onClose) {
      props.onClose();
    }
  };

  const getHelpBody = () => {
    const registrations =
      context?.keyboard.getRegistrations()[KeyEventType.KeyDown];
    if (!registrations) {
      return "";
    }

    const groupKeys = groupKeysFunc(registrations);

    return (
      <div className="container">
        {groupKeys.map((group) =>
          group.length ? getRegistrationRow(group, registrations) : null
        )}
      </div>
    );
  };

  const groupKeysFunc = (registrations: {
    [key: string]: IKeyboardBindingProps;
  }) => {
    const allKeys = Object.keys(registrations);
    const caseConsolidatedKeys = consolidateKeyCasings(allKeys);

    const groups = [];
    const alreadyGrouped = new Set();

    for (const key of caseConsolidatedKeys) {
      const group = [key];
      if (!alreadyGrouped.has(key)) {
        alreadyGrouped.add(key);
        for (const otherKey of caseConsolidatedKeys) {
          if (
            !alreadyGrouped.has(otherKey) &&
            bindingEquals(registrations[key], registrations[otherKey])
          ) {
            group.push(otherKey);
            alreadyGrouped.add(otherKey);
          }
        }
        groups.push(group);
      }
    }
    return groups;
  };

  const bindingEquals = (
    binding1: IKeyboardBindingProps,
    binding2: IKeyboardBindingProps
  ) => {
    return (
      binding1 &&
      binding2 &&
      binding1.displayName === binding2.displayName &&
      binding1.handler === binding2.handler
    );
  };

  const consolidateKeyCasings = (allKeys: string[]): string[] => {
    const lowerRegistrations: Record<string, string> = {};
    for (const key of allKeys) {
      const lowerKey = key.toLowerCase();
      if (!lowerRegistrations[lowerKey]) {
        lowerRegistrations[lowerKey] = key;
      }
    }
    return Object.keys(lowerRegistrations).map(
      (lowerKey) => lowerRegistrations[lowerKey]
    );
  };

  const getRegistrationRow = (
    group: string[],
    registrations: { [key: string]: IKeyboardBindingProps }
  ) => {
    const keyRegistration = registrations[group[0]];
    if (keyRegistration) {
      return (
        <div
          key={keyRegistration.displayName}
          className={
            "text-gray-300 p-0.5 hover:text-white hover:bg-white/10 row"
          }
        >
          <div
            className={`col-1 align-bottom py-1 px-3.5 ${
              keyRegistration.icon ? `fas ${keyRegistration.icon}` : ""
            }`}
          />
          <div className="col-4 font-bold">{stringifyGroup(group)}</div>
          <div className="col-6">{keyRegistration.displayName}</div>
        </div>
      );
    }
  };

  const stringifyGroup = (group: string[]): string => {
    return group.length < 3
      ? group.join(", ")
      : `${group[0]} - ${group[group.length - 1]}`;
  };

  return (
    <div
      className={
        "py-1.5 px-2.5 text-gray-300 inline-block hover:text-white hover:bg-white/10 hover:cursor-pointer"
      }
      onClick={() => setShow(true)}
    >
      <i className={`fas ${icon}`} />
      <KeyboardBinding
        displayName={strings.editorPage.help.title}
        accelerators={["CmdOrCtrl+H", "CmdOrCtrl+h"]}
        handler={() => setShow(!show)}
        icon={icon}
        keyEventType={KeyEventType.KeyDown}
      />
      <MessageBox
        title={strings.titleBar.help}
        message={getHelpBody()}
        show={show}
        onCancel={onClose}
        hideFooter={true}
      />
    </div>
  );
};
