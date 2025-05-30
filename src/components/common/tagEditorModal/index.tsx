import React, { useState, useEffect } from "react";
import Form, { IChangeEvent } from "@rjsf/core";
import { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { ITag } from "../../../models/applicationState";
import { constants } from "../../../common/constants";

const defaultValues = {
  tagColors: constants.tagColors,
  tagNameText: "Tag Name",
  dispNameText: "Display Name",
  editTagText: "Edit Tag",
  tagColorText: "Color",
  categoryNameText: "Categories",
  saveText: "Save",
  cancelText: "Cancel",
} as const;

type FormData = {
  name: string;
  dispName: string;
  color: string;
};

export interface ITagEditorModalProps {
  /** Function to call when "Ok" button is clicked */

  onOk: (newTag: ITag) => void;

  /**
   * Dictionary of colors indexed by color name, value is color code.
   * Used to choose colors available to apply to tags
   */
  tagColors?: { [id: string]: string };
  /** Allows for substitution of English word "Tag" */
  tagNameText?: string;
  dispNameText?: string;
  /** Allows for substitution of English word "Color" */
  tagColorText?: string;
  /** Allows for substitution of English words "Edit Tag" */
  categoryNameText?: string;
  /** Allows for substitution of English word "Color" */
  editTagText?: string;
  /** Allows for substitution of English word "Save" */
  saveText?: string;
  /** Allows for substitution of English word "Cancel" */
  cancelText?: string;

  // Optional
  /** Modal is visible. Won't have tag unless `open` is called with tag */
  show: boolean;
  tag?: ITag;
  /** Function to call when "Cancel" button is clicked or modal closed */
  onCancel?: () => void;
}

const TagEditorModal: React.FC<ITagEditorModalProps> = (props) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(props.show);
  }, [props.show]);

  const [currentTag, setCurrentTag] = useState<ITag>();

  useEffect(() => {
    setCurrentTag(props.tag);
  }, [props.tag]);

  const close = (): void => {
    setIsOpen(false);
    props.onCancel?.();
  };

  const handleFormChange = (args: IChangeEvent<FormData>): void => {
    if (args.formData) {
      setCurrentTag({
        name: args.formData.name,
        dispName: args.formData.dispName,
        color: args.formData.color,
      });
    }
  };

  const handleOk = (): void => {
    if (currentTag) {
      props.onOk(currentTag);
    }
  };

  const closeBtn = (
    <button className="close" onClick={close}>
      &times;
    </button>
  );
  const formData: FormData | undefined = !currentTag
    ? undefined
    : {
        name: currentTag.name,
        dispName: currentTag.dispName || "",
        color: currentTag.color,
      };

  const createFormSchema: () => RJSFSchema = () => {
    const keys = Object.keys(defaultValues.tagColors);
    const values = Object.values(defaultValues.tagColors);
    return {
      type: "object",
      properties: {
        name: {
          title: props.tagNameText || defaultValues.tagNameText,
          type: "string",
        },
        dispName: {
          title: props.dispNameText || defaultValues.dispNameText,
          type: "string",
        },
        color: {
          title: props.tagColorText || defaultValues.tagColorText,
          type: "string",
          enum: values,
          default: values[0],
          enumNames: keys,
        },
      },
    };
  };
  const formSchema = createFormSchema();
  const uiSchema = {};

  return (
    <div>
      <Modal isOpen={isOpen} centered={true}>
        <ModalHeader toggle={close} close={closeBtn}>
          Edit Tag
        </ModalHeader>
        <ModalBody>
          <Form
            idPrefix={"modal-form"}
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
          <Button color="success" onClick={handleOk}>
            Save
          </Button>
          <Button color="secondary" onClick={close}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default TagEditorModal;
// /**
//  * State for Tag Editor Modal
//  */
// export interface ITagEditorModalState {
//     /**  Tag originally opened with */
//     originalTag: ITag
//     /** Current tag as modified by modal */
//     currentTag: ITag
//     /** Modal is open */
//     isOpen: boolean
//     /** JSON form schema for modal body form */
// }

// export class TagEditorModal extends React.Component<
//     ITagEditorModalProps,
//     ITagEditorModalState
// > {
//     private createFormSchema: () => RJSFSchema = () => {
//         const keys = Object.keys(defaultValues.tagColors)
//         const values = Object.values(defaultValues.tagColors)
//         return {
//             type: 'object',
//             properties: {
//                 name: {
//                     title: this.props.tagNameText || defaultValues.tagNameText,
//                     type: 'string',
//                 },
//                 dispName: {
//                     title:
//                         this.props.dispNameText || defaultValues.dispNameText,
//                     type: 'string',
//                 },
//                 color: {
//                     title:
//                         this.props.tagColorText || defaultValues.tagColorText,
//                     type: 'string',
//                     enum: values,
//                     default: values[0],
//                     enumNames: keys,
//                 },
//                 categories: {
//                     title:
//                         this.props.categoryNameText ||
//                         defaultValues.categoryNameText,
//                     type: 'array',
//                     items: {
//                         type: 'string',
//                         enum: this.props.categories,
//                         enumNames: this.props.categories,
//                     },
//                     uniqueItems: true,
//                 },
//             },
//         }
//     }

//     public state: ITagEditorModalState = {
//         originalTag: null,
//         currentTag: null,
//         isOpen: this.props.show,
//     }

//     public render() {
//         const closeBtn = (
//             <button className="close" onClick={this.close}>
//                 &times;
//             </button>
//         )
//         const formData = !this.state.currentTag
//             ? null
//             : {
//                   name: this.state.currentTag.name,
//                   dispName: this.state.currentTag.dispName,
//                   color: this.state.currentTag.color,
//                   categories: !this.state.currentTag.categories
//                       ? []
//                       : [...this.state.currentTag.categories],
//               }
//         const formSchema = this.createFormSchema()
//         const uiSchema = { categories: { 'ui:widget': 'checkboxes' } }
//         return (
//             <div>
//                 <Modal isOpen={this.state.isOpen} centered={true}>
//                     <ModalHeader toggle={this.close} close={closeBtn}>
//                         {this.props.editTagText || defaultValues.editTagText}
//                     </ModalHeader>
//                     <ModalBody>
//                         <Form
//                             idPrefix={'modal-form'}
//                             schema={formSchema}
//                             uiSchema={uiSchema}
//                             formData={formData}
//                             onChange={this.handleFormChange}
//                             validator={validator}
//                         >
//                             <button
//                                 style={{
//                                     display: 'none',
//                                 }}
//                                 type="submit"
//                             ></button>
//                         </Form>
//                     </ModalBody>
//                     <ModalFooter>
//                         <Button color="success" onClick={this.handleOk}>
//                             {this.props.saveText || defaultValues.saveText}
//                         </Button>
//                         <Button color="secondary" onClick={this.close}>
//                             {this.props.cancelText || defaultValues.cancelText}
//                         </Button>
//                     </ModalFooter>
//                 </Modal>
//             </div>
//         )
//     }

//     public open = (tag: ITag): void => {
//         this.setState({
//             isOpen: true,
//             originalTag: tag,
//             currentTag: tag,
//         })
//     }

//     public close = (): void => {
//         this.setState(
//             {
//                 isOpen: false,
//             },
//             () => {
//                 if (this.props.onCancel) {
//                     this.props.onCancel()
//                 }
//             }
//         )
//     }

//     private handleFormChange = (args): void => {
//         this.setState({
//             currentTag: {
//                 name: args.formData.name,
//                 dispName: args.formData.dispName,
//                 color: args.formData.color,
//                 categories: !args.formData.categories
//                     ? []
//                     : [...args.formData.categories],
//             },
//         })
//     }

//     private handleOk = (e): void => {
//         this.props.onOk(this.state.originalTag, this.state.currentTag)
//     }
// }
