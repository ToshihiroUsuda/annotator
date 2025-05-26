import * as React from "react";
import Form, { IChangeEvent } from "@rjsf/core";
import { RJSFSchema } from "@rjsf/utils";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import validator from "@rjsf/validator-ajv8";
import "./timeSeekModal.scss";

type TFormData = {
  minutes: number;
  seconds: number;
};

export interface ITimeSeekModalProps {
  show: boolean;
  timestamp?: number;
  onSave: (timestamp: number) => void;
  onCancel?: () => void;
}

const formSchema: RJSFSchema = {
  type: "object",
  properties: {
    minutes: {
      title: "Minutes",
      type: "integer",
      minimum: 0,
      maximum: 59,
    },
    seconds: {
      title: "Seconds",
      type: "number",
      minimum: 0,
      maximum: 60,
      multipleOf: 0.01,
    },
  },
};

const uiSchema = {
  minutes: {
    "ui:widget": "updown",
  },
  seconds: {
    "ui:widget": "updown",
  },
};

export const TimeSeekModal: React.FC<ITimeSeekModalProps> = (props) => {
  const [isOpen, setIsOpen] = React.useState(props.show);
  React.useEffect(() => {
    setIsOpen(props.show);
  }, [props.show]);

  const [formData, setFormData] = React.useState<TFormData>();

  React.useEffect(() => {
    if (props.timestamp !== undefined) {
      const m = Math.floor((props.timestamp / 60) % 60);
      const s = Math.round((props.timestamp - m * 60) * 100) / 100;
      setFormData({ minutes: m, seconds: s });
    }
  }, [props.timestamp]);

  const close = React.useCallback((): void => {
    setIsOpen(false);
    props.onCancel?.();
  }, [props]);

  const handleFormChange = React.useCallback(
    (changeEvent: IChangeEvent<TFormData>) => {
      if (changeEvent.formData) {
        setFormData(changeEvent.formData);
      }
    },
    []
  );

  const handleSave = React.useCallback(() => {
    if (formData) {
      const timestamp = formData.minutes * 60 + formData.seconds;
      props.onSave(timestamp);
      setIsOpen(false);
    }
  }, [formData, props]);

  const closeBtn = (
    <button className="close" onClick={close}>
      &times;
    </button>
  );

  return (
    <Modal isOpen={isOpen} centered={true}>
      <ModalHeader toggle={close} close={closeBtn}>
        Seek to Time
      </ModalHeader>
      <ModalBody>
        <Form<TFormData>
          schema={formSchema}
          uiSchema={uiSchema}
          formData={formData}
          onChange={handleFormChange}
          validator={validator}
        >
          <button
            style={{
              display: "none",
            }}
            type="submit"
          ></button>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button color="success" onClick={handleSave}>
          Seek
        </Button>
        <Button color="secondary" onClick={close}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
