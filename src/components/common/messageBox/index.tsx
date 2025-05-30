import React, { SyntheticEvent, ReactElement } from "react";
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

export interface IMessageBoxState {
  isOpen: boolean;
  isRendered: boolean;
  isButtonSelected: boolean;
}

/**
 * Generic modal that displays a message
 */
export default class MessageBox extends React.Component<
  IMessageBoxProps,
  IMessageBoxState
> {
  constructor(props: IMessageBoxProps) {
    super(props);

    this.state = {
      isOpen: !!props.show,
      isRendered: !!props.show,
      isButtonSelected: false,
    };

    this.toggle = this.toggle.bind(this);
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.onFooterClick = this.onFooterClick.bind(this);
    this.onClosed = this.onClosed.bind(this);
  }

  public render() {
    if (!this.state.isRendered) {
      return null;
    }

    return (
      <Modal
        className="messagebox-modal"
        isOpen={this.state.isOpen}
        onClosed={this.onClosed}
      >
        <ModalHeader toggle={this.toggle}>{this.props.title}</ModalHeader>
        <ModalBody>{this.getMessage(this.props.message)}</ModalBody>
        {!this.props.hideFooter && (
          <ModalFooter onClick={this.onFooterClick}>
            {this.props.children}
          </ModalFooter>
        )}
      </Modal>
    );
  }

  public open(): void {
    this.setState({
      isOpen: true,
      isRendered: true,
      isButtonSelected: false,
    });
  }

  public close(): void {
    this.setState(
      {
        isOpen: false,
      },
      () => {
        if (!this.state.isButtonSelected) {
          this.props.onCancel?.();
        }
      }
    );
  }

  public componentDidUpdate(prevProps: Readonly<IMessageBoxProps>): void {
    if (prevProps.show !== this.props.show) {
      this.setState({
        isOpen: !!this.props.show,
        isRendered: !!this.props.show,
      });
    }
  }

  private getMessage = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    message: string | MessageFormatHandler | ReactElement<any>
  ) => {
    if (typeof message === "string" || React.isValidElement(message)) {
      return message;
    } else if (
      typeof message === "function" &&
      this.props.params !== undefined
    ) {
      return message.apply(this, this.props.params);
    }
  };

  private onFooterClick(evt: SyntheticEvent) {
    const htmlElement = evt.target as HTMLButtonElement;
    if (htmlElement.tagName === "BUTTON") {
      this.setState(
        {
          isButtonSelected: true,
        },
        () => {
          this.close();
          this.props.onButtonSelect?.(htmlElement);
        }
      );
    }
  }

  private toggle() {
    if (this.state.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  private onClosed() {
    this.setState({
      isRendered: false,
    });
  }
}
