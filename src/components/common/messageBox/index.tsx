import React, {
  SyntheticEvent,
  ReactElement,
  useState,
  useEffect,
} from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MessageFormatHandler = (...params: any[]) => string;

export interface IMessageBoxProps extends React.PropsWithChildren {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: string | ReactElement<any> | MessageFormatHandler;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any[];
  onButtonSelect?: (button: HTMLButtonElement) => void;
  onCancel?: () => void;
  show?: boolean;
  hideFooter?: boolean;
}

/**
 * Generic modal that displays a message
 */
const MessageBox = (props: IMessageBoxProps) => {
  const [isOpen, setIsOpen] = useState(!!props.show);
  const [isRendered, setIsRendered] = useState(!!props.show);
  const [isButtonSelected, setIsButtonSelected] = useState(false);

  useEffect(() => {
    if (props.show !== isOpen) {
      setIsOpen(!!props.show);
      setIsRendered(!!props.show);
    }
  }, [props.show]);

  const getMessage = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    message: string | MessageFormatHandler | ReactElement<any>
  ) => {
    if (typeof message === "string" || React.isValidElement(message)) {
      return message;
    } else if (typeof message === "function" && props.params !== undefined) {
      return message.apply(null, props.params);
    }
  };

  const onFooterClick = (evt: SyntheticEvent) => {
    const htmlElement = evt.target as HTMLButtonElement;
    if (htmlElement.tagName === "BUTTON") {
      setIsButtonSelected(true);
      close();
      props.onButtonSelect?.(htmlElement);
    }
  };

  const toggle = () => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  };

  const open = (): void => {
    setIsOpen(true);
    setIsRendered(true);
    setIsButtonSelected(false);
  };

  const close = (): void => {
    setIsOpen(false);
    if (!isButtonSelected) {
      props.onCancel?.();
    }
  };

  const onClosed = () => {
    setIsRendered(false);
  };

  if (!isRendered) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClosed={onClosed}>
      <ModalHeader toggle={toggle} className="text-white">
        {props.title}
      </ModalHeader>
      <ModalBody className="text-white">{getMessage(props.message)}</ModalBody>
      {!props.hideFooter && (
        <ModalFooter onClick={onFooterClick}>{props.children}</ModalFooter>
      )}
    </Modal>
  );
};

export default MessageBox;
