import React, { useState, useEffect } from "react";
import { Button } from "reactstrap";
import MessageBox, { IMessageBoxProps } from "../messageBox";

export interface IConfirmProps<T = unknown> extends IMessageBoxProps {
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onConfirm: (...params: T[]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCancel?: (...params: T[]) => void;
  params?: T[];
}

const Confirm = <T,>(props: IConfirmProps<T>) => {
  const [params, setParams] = useState<T[]>(props.params || []);

  useEffect(() => {
    setParams(props.params || []);
  }, [props.params]);

  const onConfirmClick = () => {
    props.onConfirm.apply(null, params);
  };

  const onCancelClick = () => {
    if (props.onCancel) {
      props.onCancel.apply(null, params);
    }
  };

  return (
    <MessageBox
      show={props.show}
      title={props.title}
      message={props.message}
      params={params}
      onCancel={onCancelClick}
    >
      <Button
        autoFocus={true}
        color={props.confirmButtonColor || "primary"}
        onClick={onConfirmClick}
      >
        {props.confirmButtonText || "Yes"}
      </Button>
      <Button
        color={props.cancelButtonColor || "secondary"}
        onClick={onCancelClick}
      >
        {props.cancelButtonText || "No"}
      </Button>
    </MessageBox>
  );
};

export default Confirm;
