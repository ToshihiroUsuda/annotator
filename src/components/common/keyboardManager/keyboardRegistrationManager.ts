import Guard from '../../../common/guard'
import { AppError, ErrorCode } from '../../../models/applicationState'
import { IKeyboardBindingProps } from '../keyboardBinding'
import { KeyEventType } from '.'

export interface IKeyboardRegistrations {
    [keyEventType: string]: {
        [key: string]: IKeyboardBindingProps
    }
}

export type KeyboardEventHandler = (evt?: KeyboardEvent) => void

export class KeyboardRegistrationManager {
    private registrations: IKeyboardRegistrations = {}

    public registerBinding = (binding: IKeyboardBindingProps) => {
        const { keyEventType, accelerators, handler, displayName } = binding
        Guard.expression(accelerators, (keyCodes) => keyCodes.length > 0)
        Guard.null(handler)

        let eventTypeRegistrations = this.registrations[keyEventType]
        if (!eventTypeRegistrations) {
            eventTypeRegistrations = {}
            this.registrations[keyEventType] = eventTypeRegistrations
        }

        accelerators.forEach((keyCode) => {
            const currentBinding = this.registrations[keyEventType][keyCode]
            if (currentBinding) {
                let error = `Key code ${keyCode} on key event "${keyEventType}" `
                error += `already has binding registered: "${currentBinding.displayName}." `
                error += `Cannot register binding "${displayName}" with the same key code and key event type`
                throw new AppError(ErrorCode.OverloadedKeyBinding, error)
            }
            this.registrations[keyEventType][keyCode] = binding
        })

        return () => {
            binding.accelerators.forEach((keyCode) => {
                delete this.registrations[binding.keyEventType][keyCode]
            })
        }
    }

    public getHandler(
        keyEventType: KeyEventType,
        keyCode: string
    ): (evt?: KeyboardEvent) => void {
        Guard.null(keyCode)

        const keyEventTypeRegs = this.registrations[keyEventType]
        return keyEventTypeRegs && keyEventTypeRegs[keyCode]
            ? keyEventTypeRegs[keyCode].handler
            : () => {}
    }

    public invokeHandler(
        keyEventType: KeyEventType,
        keyCode: string,
        evt: KeyboardEvent
    ) {
        Guard.null(keyCode)
        Guard.null(evt)

        const handler = this.getHandler(keyEventType, keyCode)
        if (handler !== null) {
            handler(evt)
        }
    }

    public getRegistrations = () => {
        return this.registrations
    }
}
