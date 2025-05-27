import * as React from "react";
import Form, { IChangeEvent } from "@rjsf/core";
import { RJSFSchema } from "@rjsf/utils";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { IRegion, ITag } from "../../../../models/applicationState";
import { LocalFileSystem } from "../../../../providers/storage/localFileSystem";
import ArrayFieldTemplate from "../../../common/arrayField/arrayFieldTemplate";
import FieldTemplate from "../../../common/customField/customFieldTemplate";
import { ObjectFieldTemplate } from "../../../common/objectField/objectFieldTemplate";
import validator from "@rjsf/validator-ajv8";
import "./regionInfoInputModal.scss";

type IFormShemaReord = Record<string, RJSFSchema>;
type IUiSchemaReord = Record<string, Record<string, unknown>>;

const loadShema = async (shemaPath: string) => {
  let schema = { schema: { properties: {} }, uiSchema: {} };
  try {
    if (!!shemaPath) {
      schema = JSON.parse(await LocalFileSystem.readText(shemaPath));
    }
    // this.regionInformationSchema = JSON.parse(await localFileSystem.readText(this.props.appSettings.regionInformationSchema))
  } catch {
    schema = { schema: { properties: {} }, uiSchema: {} };
  }

  const formSchema: IFormShemaReord = schema["schema"]["properties"];
  const uiSchema: IUiSchemaReord = schema["uiSchema"];
  return { formSchema, uiSchema };
};
/**
 * Properties for Tag Editor Modal
 */
export interface IRegionInfoInputModalProps {
  /** Function to call when "Ok" button is clicked */
  show: boolean;
  region?: IRegion;
  schemaPath: string;
  onSave: (region: IRegion) => void;
  tags: ITag[];
  isFrozen: boolean;
  onCancel?: () => void;
  onReset?: () => void;
}

/**
 * Simple modal for editing the name and color of project tags
 */
export const RegionInfoInputModal: React.FC<IRegionInfoInputModalProps> = (
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
    setFormData(props.region?.regionInfo || {});
  }, [props.region]);

  const [formSchemaRecord, setFormSchemaRecord] = React.useState<
    Record<string, RJSFSchema>
  >({});

  const [uiSchemaRecord, setUiSchemaRecord] = React.useState<
    Record<string, any>
  >({});

  React.useEffect(() => {
    loadShema(props.schemaPath)
      .then((schema) => {
        setFormSchemaRecord(schema.formSchema);
        setUiSchemaRecord(schema.uiSchema);
      })
      .catch((error) => {
        console.error("Error loading schema:", error);
      });
  }, []);

  const close = React.useCallback((): void => {
    setIsOpen(false);
    props.onCancel?.();
  }, [props]);

  const reset = React.useCallback((): void => {
    setFormData({});
    if (props.region) {
      const updatedRegion = { ...props.region, regionInfo: {} };
      props.onSave(updatedRegion);
    }
    props.onReset?.();
  }, [props.region]);

  const handleFormChange = React.useCallback((args: IChangeEvent): void => {
    setFormData(args.formData);
  }, []);

  const handleSave = React.useCallback((): void => {
    if (props.region) {
      const updatedRegion = { ...props.region, regionInfo: formData };
      props.onSave(updatedRegion);
      setIsOpen(false);
    }
  }, [formData, props.region]);

  let isShow = isOpen;
  let formSchema: RJSFSchema | undefined = { type: "object", properties: {} };
  let uiSchema: Record<string, unknown> | undefined = {};
  let title = "";

  if (!props.region) {
    isShow = false;
  } else if (props.region.tags.length === 0) {
    isShow = false;
  } else if (!(props.region.tags[0] in formSchemaRecord)) {
    isShow = false;
  } else {
    formSchema = formSchemaRecord[props.region.tags[0]];
    uiSchema = uiSchemaRecord[props.region.tags[0]];
    const tag = props.tags.find((tag) => tag.name === props.region?.tags[0]);
    if (tag) {
      title = tag.dispName || tag.name;
    }
  }

  const closeBtn = (
    <button className="close" onClick={close}>
      &times;
    </button>
  );

  return (
    <Modal isOpen={isOpen} centered={true}>
      <ModalHeader toggle={close} close={closeBtn}>
        {title}
      </ModalHeader>
      <ModalBody>
        <Form
          idPrefix={"report-form"}
          schema={formSchemaRecord}
          uiSchema={uiSchemaRecord}
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
