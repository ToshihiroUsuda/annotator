import moment from "moment";
import React, { useImperativeHandle, useState, useEffect } from "react";
import Form, { IChangeEvent } from "@rjsf/core";
import { RJSFSchema } from "@rjsf/utils";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { IReport } from "../../../models/applicationState";
import validator from "@rjsf/validator-ajv8";

type TFormData = { id: string };

export interface IOverwriteModalProps {
  show: boolean;
  recentReports: IReport[];
  onOverwrite: (id: string) => void;
  onCancel?: () => void;
}

const OverwriteModal: React.FC<IOverwriteModalProps> = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<TFormData>();

  useEffect(() => {
    setIsOpen(props.show);
  }, [props.show]);

  const close = (): void => {
    props.onCancel?.();
    setIsOpen(false);
  };

  const onChange = (changeEvent: IChangeEvent<TFormData>) => {
    if (changeEvent.formData) {
      setFormData({ ...changeEvent.formData });
    }
  };

  const onOverwriteClick = () => {
    if (formData?.id) {
      props.onOverwrite(formData.id);
      close();
    }
  };
  const unnamedReports = props.recentReports.filter((r) => !r.name);
  const ids = unnamedReports.map((report: IReport) => report.id);
  const names = unnamedReports.map((report: IReport) => {
    if (!report.examDateTime) {
      return `Report(${report.id})`;
    }
    const timezone = -moment().toDate().getTimezoneOffset() / 60;
    let format: string;
    switch (timezone) {
      case 0:
      case 1:
      case 2:
        format = "DD/MM/YYYY HH:mm:ss";
        break;
      case 9:
      default:
        format = "YYYY/MM/DD HH:mm:ss";
        break;
    }
    return `Report(${report.id}) ${moment(report.examDateTime).format(format)}`;
  });

  const formSchema: RJSFSchema = {
    type: "object",
    properties: {
      id: {
        type: "string",
        title: "Overwrite report with",
        anyOf: ids.map((id, idx) => ({
          type: "string",
          title: names[idx],
          enum: [id],
        })),
      },
    },
  };

  const closeBtn = (
    <button className="close" onClick={close}>
      &times;
    </button>
  );

  return (
    <Modal isOpen={isOpen} centered={true}>
      <ModalHeader toggle={close} close={closeBtn}>
        Overwrite Report
      </ModalHeader>
      <ModalBody>
        <Form<TFormData>
          idPrefix={"private-form"}
          schema={formSchema}
          formData={formData}
          onChange={onChange}
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
        <Button color="success" onClick={onOverwriteClick}>
          Overwrite
        </Button>
        <Button color="secondary" onClick={close}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default OverwriteModal;

/**
 * State for Tag Editor Modal
 */
// export interface IOverwriteModalState {
//     isOpen: boolean
//     formData: any
// }

// export class OverwriteModalCC extends React.Component<
//     IOverwriteModalProps,
//     IOverwriteModalState
// > {
//     public state: IOverwriteModalState = {
//         isOpen: false,
//         formData: null,
//     }

//     public render() {
//         const unnamedReports = this.props.recentReports.filter((r) => !r.name)
//         const ids = unnamedReports.map((report: IReport) => report.id)
//         const names = unnamedReports.map((report: IReport) => {
//             if (!report.examDateTime) {
//                 return `Report(${report.id})`
//             }
//             const timezone = -moment().toDate().getTimezoneOffset() / 60
//             let format: string
//             switch (timezone) {
//                 case 0:
//                 case 1:
//                 case 2:
//                     format = 'DD/MM/YYYY HH:mm:ss'
//                     break
//                 case 9:
//                 default:
//                     format = 'YYYY/MM/DD HH:mm:ss'
//                     break
//             }
//             return `Report(${report.id}) ${moment(report.examDateTime).format(format)}`
//         })

//         const formSchema: RJSFSchema = {
//             type: 'object',
//             properties: {
//                 id: {
//                     type: 'string',
//                     title: 'Overwrite report with',
//                     anyOf: ids.map((id, idx) => ({
//                         type: 'string',
//                         title: names[idx],
//                         enum: [id],
//                     })),
//                 },
//             },
//         }

//         const closeBtn = (
//             <button className="close" onClick={this.close}>
//                 &times;
//             </button>
//         )

//         return (
//             <Modal isOpen={this.state.isOpen} centered={true}>
//                 <ModalHeader toggle={this.close} close={closeBtn}>
//                     Overwrite Report
//                 </ModalHeader>
//                 <ModalBody>
//                     <Form<TFormData>
//                         idPrefix={'private-form'}
//                         schema={formSchema}
//                         formData={this.state.formData}
//                         onChange={this.onChange}
//                         validator={validator}
//                     >
//                         <button
//                             style={{
//                                 display: 'none',
//                             }}
//                             type="submit"
//                         ></button>
//                     </Form>
//                 </ModalBody>
//                 <ModalFooter>
//                     <Button color="success" onClick={this.onOverwriteClick}>
//                         Overwrite
//                     </Button>
//                     <Button color="secondary" onClick={this.close}>
//                         Cancel
//                     </Button>
//                 </ModalFooter>
//             </Modal>
//         )
//     }

//     /**
//      * Open editor modal with tag
//      * @param formData Tag to be edited
//      */
//     public open = () => {
//         this.setState({
//             isOpen: true,
//         })
//     }

//     /**
//      * Close editor modal and call `onCancel` if provided
//      */
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

//     private onChange = (changeEvent: IChangeEvent<TFormData>) => {
//         this.setState({
//             formData: { ...changeEvent.formData },
//         })
//     }
//     /**
//      * Called when "Ok" is clicked
//      */
//     private onOverwriteClick = () => {
//         const id = this.state.formData.id
//         this.props.onOverwrite(id)
//         this.close()
//     }
// }
