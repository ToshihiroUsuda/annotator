import * as React from "react";
import Form, { IChangeEvent } from "@rjsf/core";
import { RJSFSchema } from "@rjsf/utils";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import validator from "@rjsf/validator-ajv8";

type TFormData = { comment: string };

export interface ICommentInputModalProps {
  show?: boolean;
  comment?: string;
  onSave: (comment: string) => void;
  saveText?: string;
  cancelText?: string;
  resetText?: string;
  isFrozen: boolean;
  onCancel?: () => void;
  onReset?: () => void;
}

const formSchema: RJSFSchema = {
  type: "object",
  properties: {
    comment: {
      title: "Comment",
      type: "string",
    },
  },
};

const uiSchema = {
  comment: {
    "ui:widget": "textarea",
  },
};

export const CommentInputModal: React.FC<ICommentInputModalProps> = (props) => {
  const [isOpen, setIsOpen] = React.useState(props.show);
  React.useEffect(() => {
    setIsOpen(props.show);
  }, [props.show]);

  const [formData, setFormData] = React.useState<TFormData>();
  React.useEffect(() => {
    setFormData({ comment: props.comment || "" });
  }, [props.comment]);

  const close = (): void => {
    setIsOpen(false);
    props.onCancel?.();
  };

  const reset = (): void => {
    setFormData({ comment: "" });
    props.onSave("");
    props.onReset?.();
  };

  const handleFormChange = (changeEvent: IChangeEvent<TFormData>) => {
    if (changeEvent.formData) {
      setFormData(changeEvent.formData);
    }
  };

  const handleSave = () => {
    if (formData?.comment !== undefined) {
      props.onSave(formData.comment);
      setIsOpen(false);
    }
  };

  const closeBtn = (
    <button className="close" onClick={close}>
      &times;
    </button>
  );

  return (
    <Modal isOpen={isOpen} centered={true}>
      <ModalHeader toggle={close} close={closeBtn}></ModalHeader>
      <ModalBody>
        <Form<TFormData>
          idPrefix={"comment-form"}
          schema={formSchema}
          uiSchema={uiSchema}
          formData={formData}
          onChange={handleFormChange}
          validator={validator}
        >
          <button className="hidden" type="submit"></button>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button color="success" onClick={handleSave}>
          Save
        </Button>
        <Button color="secondary" onClick={close}>
          Cancel
        </Button>
        <Button color="danger" onClick={reset}>
          Reset
        </Button>
      </ModalFooter>
    </Modal>
  );
};
