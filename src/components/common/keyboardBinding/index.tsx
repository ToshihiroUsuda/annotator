import React, { useContext, useEffect, useRef } from 'react'
import {
    IKeyboardContext,
    KeyboardContext,
    KeyEventType,
} from '../keyboardManager'

/**
 * Properties needed for a keyboard binding
 */
export interface IKeyboardBindingProps {
    /** Keys that the action is bound to */
    accelerators: string[]
    /** Friendly name for keyboard binding for display in help menu */
    displayName: string
    /** Action to trigger upon key event */
    handler: (evt?: KeyboardEvent) => void
    /** Type of key event (keypress, keyup, keydown) */
    keyEventType: KeyEventType
    /** Icon to display in help menu */
    icon?: string
}

export const KeyboardBinding: React.FC<IKeyboardBindingProps> = (props) => {
    const context = useContext(KeyboardContext)
    const deregisterBinding = useRef<(() => void) | undefined>()

    useEffect(() => {
        if (context?.keyboard) {
            deregisterBinding.current = context.keyboard.registerBinding(
                props
            )
        } else {
            console.warn(
                'Keyboard Mananger context cannot be found - Keyboard binding has NOT been set.'
            )
        }

        return () => {
            if (typeof deregisterBinding.current === 'function') {
                deregisterBinding.current()
            }
        }
    }, [context, props])

    return null
}
