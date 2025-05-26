import * as React from "react";
import Form, { IChangeEvent } from "@rjsf/core";
import { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import ArrayFieldTemplate from "../../../common/arrayField/arrayFieldTemplate";
import FieldTemplate from "../../../common/customField/customFieldTemplate";
import { ObjectFieldTemplate } from "../../../common/objectField/objectFieldTemplate";
import "./FrameLabelModal.scss";
import { LocalFileSystem } from "../../../../providers/storage/localFileSystem";
/**
 * Properties for Tag Editor Modal
 */
export interface IFrameLabelInputModalProps {
  /** Function to call when "Ok" button is clicked */
  frameLabel?: string;
  onSave: (step: string) => void;
  schemaPath: string;
  isFrozen: boolean;
  show?: boolean;
  onCancel?: () => void;
  onReset?: () => void;
}

export const FrameLabelInputModal: React.FC<IFrameLabelInputModalProps> = (
  props
) => {
  const [isOpen, setIsOpen] = React.useState(props.show);
  React.useEffect(() => {
    setIsOpen(props.show);
  }, [props.show]);

  const [formData, setFormData] = React.useState<Record<
    string,
    unknown
  > | null>(null);

  React.useEffect(() => {
    let formData = {};
    if (props.frameLabel) {
      try {
        formData = { step: JSON.parse(props.frameLabel) };
      } catch {
        formData = { step: props.frameLabel };
      }
    }
    setFormData({ ...formData });
  }, [props.frameLabel]);

  const [formSchema, setFormShema] = React.useState<RJSFSchema>({});
  React.useEffect(() => {
    (async () => {
      try {
        if (!!props.schemaPath) {
          setFormShema(
            JSON.parse(await LocalFileSystem.readText(props.schemaPath))
          );
        }
      } catch {
        setFormShema({ properties: {} });
      }
    })();
  }, []);

  const close = React.useCallback((): void => {
    setIsOpen(false);
    props.onCancel?.();
  }, [props]);

  const reset = React.useCallback((): void => {
    setFormData({});
    props.onSave("");
    if (props.onReset) {
      props.onReset();
    }
  }, [props]);

  const handleFormChange = React.useCallback((args: IChangeEvent): void => {
    setFormData(args.formData);
  }, []);

  const handleSave = React.useCallback(async (): Promise<void> => {
    let step = JSON.stringify(formData?.step);
    if (step === "{}") {
      step = "";
    }
    props.onSave(step);
    setIsOpen(false);
  }, [formData, props]);

  const closeBtn = (
    <button className="close" onClick={close}>
      &times;
    </button>
  );

  return (
    <Modal isOpen={isOpen} centered={true}>
      <ModalHeader toggle={close} close={closeBtn}>
        Frame Label
      </ModalHeader>
      <ModalBody>
        <Form
          schema={formSchema}
          templates={{
            ObjectFieldTemplate,
            FieldTemplate,
            ArrayFieldTemplate,
          }}
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
