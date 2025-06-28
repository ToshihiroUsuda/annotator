import React from "react";

import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { IReport } from "../../../models/applicationState";
import { IReportActions } from "../../../atom/actions/report";

import TaskProgressTable from "./taskProgressTable";

type TNameInputModalProps = {
  isOpen: boolean;
  caseData: Record<string, Record<string, string>>;
  reportActions: IReportActions;
  recentReports: IReport[];
  onClose?: () => void;
};

const NameInputModal: React.FC<TNameInputModalProps> = (props) => {
  const handleClose = () => {
    if (props.onClose) {
      props.onClose();
    }
  };
  return (
    <Modal size="lg" centered isOpen={props.isOpen}>
      <ModalHeader toggle={() => handleClose()}>Please input name</ModalHeader>
      <ModalBody>
        <div className="h-96">
          <TaskProgressTable
            caseData={props.caseData}
            recentReports={props.recentReports}
            reportActions={props.reportActions}
            showColumnList={["case", "date", "time", "doctor"]}
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="success" onClick={() => handleClose()}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default NameInputModal;
