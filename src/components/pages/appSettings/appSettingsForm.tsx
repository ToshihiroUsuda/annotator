import React, { useState, useRef } from "react";
import { FaCog } from "react-icons/fa";
import { FieldProps, CustomValidator } from "@rjsf/utils";
import Form, { IChangeEvent } from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import { constants } from "../../../common/constants";
import {
  AppError,
  ErrorCode,
  IAppSettings,
  ITag,
} from "../../../models/applicationState";
import { LocalFileSystem } from "../../../providers/storage/localFileSystem";
import ArrayFieldTemplate from "../../common/arrayField/arrayFieldTemplate";
import { FileButtonSet } from "./buttons/fileButtonSet";
import { CustomField } from "../../common/customField";
import FieldTemplate from "../../common/customField/customFieldTemplate";
import {
  ILocalFilePickerProps,
  LocalFilePicker,
  ILocalDirectoryPickerProps,
  LocalDirectoryPicker,
} from "../../common/localPicker";
import { ObjectFieldTemplate } from "../../common/objectField/objectFieldTemplate";
import { ITagsInputFormProps, TagsInputForm } from "./tagsInputForm";
import { formSchema, uiSchema } from "./schema";
import { strings } from "../../../common/strings";
import path from "path-browserify";

export interface IAppSettingsFormProps {
  appSettings: IAppSettings;
  onSubmit: (appSettings: IAppSettings) => void;
  onCancel?: (appSettings: IAppSettings) => void;
  onChange?: (appSettings: IAppSettings) => void;
  onExport?: () => void;
  onImport?: (appSettings: IAppSettings) => void;
}

export const AppSettingsForm: React.FC<IAppSettingsFormProps> = (props) => {
  const [classNames, setClassNames] = useState<string[]>(["needs-validation"]);
  const [appSettings, setAppSettings] = useState<IAppSettings>({
    ...props.appSettings,
  });
  const tagsInput = useRef<ITagsInputFormProps | null>(null);

  const fields = () => {
    return {
      folderPicker: CustomField<ILocalDirectoryPickerProps>(
        LocalDirectoryPicker,
        (props: FieldProps<string>) => {
          return {
            id: props.id,
            defaultValue: props.formData || "",
            onChange: (value: string) => {
              props.onChange(value);
            },
          };
        }
      ),
      jsonFilePicker: CustomField<ILocalFilePickerProps>(
        LocalFilePicker,
        (props: FieldProps<string>) => {
          return {
            id: props.id,
            defaultValue: props.formData || "",
            onChange: (value: string) => {
              props.onChange(value);
            },
            extension: "json",
          };
        }
      ),
      pythonFilePicker: CustomField<ILocalFilePickerProps>(
        LocalFilePicker,
        (props: FieldProps<string>) => {
          return {
            id: props.id,
            defaultValue: props.formData || "",
            onChange: (value: string) => {
              props.onChange(value);
            },
            extension: "py",
          };
        }
      ),
      tagsInput: CustomField<ITagsInputFormProps>(
        TagsInputForm,
        (props: FieldProps<ITag[]>) => {
          return {
            ref: tagsInput,
            tags: props.formData || [],
            tagColors: constants.tagColors,
            categries: [...appSettings.tagCategories],
            onChange: props.onChange,
            onImport: onTagsFileImport,
          };
        }
      ),
    };
  };

  const onFormValidate: CustomValidator<IAppSettings> = (_formData, errors) => {
    if (classNames.indexOf("was-validated") === -1) {
      setClassNames([...classNames, "was-validated"]);
    }

    return errors;
  };

  const onFormSubmit = (data: IChangeEvent<IAppSettings>): void => {
    if (data.formData) {
      const updatedSettings = { ...data.formData };
      setAppSettings(updatedSettings);
      props.onSubmit(updatedSettings);
    }
  };

  const onFormCancel = () => {
    if (props.onCancel) {
      props.onCancel(props.appSettings);
    }
  };

  const onFormChange = (data: IChangeEvent<IAppSettings>) => {
    if (data.formData) {
      const updatedSettings = { ...data.formData };
      setAppSettings({ ...data.formData });
      props.onChange?.(updatedSettings);
    }
  };

  const onTagsFileImport = async (tags: ITag[]) => {
    const updatedSettings = {
      ...appSettings,
      tags: tags,
    };

    setAppSettings(updatedSettings);
  };

  const onSettingsFileImport = async (fileContent: string) => {
    try {
      const parsedSettings = JSON.parse(fileContent);
      setAppSettings(parsedSettings);
      if (props.onImport) {
        props.onImport(parsedSettings);
      }
    } catch {
      throw new AppError(ErrorCode.ProjectInvalidJson, "Error parsing JSON");
    }
  };

  const onSettingsFileExport = async (folderPath: string) => {
    await LocalFileSystem.writeText(
      path.join(folderPath, constants.appSettingsFile),
      JSON.stringify(appSettings, null, 4)
    );
    props.onExport?.();
  };

  const FormComponent = Form<IAppSettings>;
  return (
    <div className="p-3 max-h-[calc(100vh-1.5rem)] overflow-y-auto">
      <div className="my-4 flex items-center h-10">
        <FaCog size={36} />
        <div className="px-2 text-4xl font-bold">
          {strings.appSettings.title}
        </div>
      </div>
      <div className="m-3 ">
        <FormComponent
          className={classNames.join(" ")}
          showErrorList={false}
          liveValidate
          noHtml5Validate
          fields={fields()}
          templates={{
            ObjectFieldTemplate,
            FieldTemplate,
            ArrayFieldTemplate,
          }}
          validator={validator}
          customValidate={onFormValidate}
          schema={formSchema}
          uiSchema={uiSchema}
          formData={appSettings}
          onChange={onFormChange}
          onSubmit={onFormSubmit}
        >
          <div className="mt-auto flex flex-row">
            <div className="mr-2.5">
              <button type="submit" className="btn btn-primary btn-success">
                {strings.appSettings.save}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-cancel"
                onClick={onFormCancel}
              >
                {strings.common.cancel}
              </button>
            </div>
            <FileButtonSet
              onImport={onSettingsFileImport}
              onExport={onSettingsFileExport}
            />
          </div>
        </FormComponent>
      </div>
    </div>
  );
};
