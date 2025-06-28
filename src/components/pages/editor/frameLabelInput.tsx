import React, { useEffect, useState } from "react";
import Form, { IChangeEvent } from "@rjsf/core";
import { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";

interface IFrameLabelInputProps {
  step: string;
  onChange: (step: string) => void;
  formSchema: RJSFSchema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uiSchema: any;
  isFrozen: boolean;
}

const FrameLabelInput: React.FC<IFrameLabelInputProps> = (props) => {
  const [step, setStep] = useState(props.step);

  useEffect(() => {
    setStep(props.step);
  }, [props.step, setStep]);

  const formSchema = props.formSchema;
  const uiSchema = props.uiSchema || {};

  if (!formSchema) return null;
  /**
   * json-schemaで柔軟にするために強引なやり方になっている
   * いずれ修正したい
   */
  let formData = {};
  try {
    formData = { step: JSON.parse(step) };
  } catch {
    formData = { step: step };
  }

  const handleChange = (e: IChangeEvent) => {
    /**
     * json-schemaで柔軟にするために強引なやり方になっている
     * いずれ修正したい
     */
    let step = JSON.stringify(e.formData.step);
    if (step === "{}") {
      step = "";
    }
    props.onChange(step);
    setStep(step);
  };

  return (
    <div className="bg-white/5">
      <h6 className="text-xs text-gray-100 m-0 uppercase bg-black/20 p-2 text-[80%]">
        <span>Frame Information</span>
      </h6>
      <div className="m-2">
        <Form
          schema={formSchema}
          uiSchema={uiSchema}
          formData={formData}
          onChange={handleChange}
          disabled={props.isFrozen}
          validator={validator}
        >
          <button className="hidden" type="submit"></button>
        </Form>
      </div>
    </div>
  );
};

export default FrameLabelInput;
