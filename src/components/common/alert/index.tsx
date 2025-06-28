import React from 'react'
import { Button } from 'reactstrap'
import MessageBox, { IMessageBoxProps } from '../messageBox'

export interface IAlertProps extends IMessageBoxProps {
    closeButtonText?: string
    closeButtonColor?: string
    onClose: () => void
    show?: boolean
}

const Alert: React.FC<IAlertProps> = (props) => {

    const onCloseClick = () => {
        if (props.onClose) {
            props.onClose()
        }
    }

    return (
        <MessageBox
            title={props.title}
            message={props.message}
            show={props.show}
        >
            <Button
                autoFocus={true}
                color={props.closeButtonColor || 'primary'}
                onClick={onCloseClick}
            >
                {props.closeButtonText || 'OK'}
            </Button>
        </MessageBox>
    )
}

export default Alert
