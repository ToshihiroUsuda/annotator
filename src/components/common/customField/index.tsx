import React from 'react'

import { FieldProps, WidgetProps } from '@rjsf/utils'
import Guard from '../../../common/guard'
import shortid from 'shortid'

export function CustomField<Props>(
    Widget: React.ComponentType<Props>,
    mapProps: (props: FieldProps) => Props
) {
    Guard.null(Widget)

    return function render(props: FieldProps) {
        const widgetProps = mapProps(props)
        return <Widget key={shortid.generate()} {...widgetProps} />
    }
}

export function CustomWidget<Props>(
    Widget: React.ComponentType<Props>,
    mapProps: (props: WidgetProps) => Props
) {
    Guard.null(Widget)

    return function render(props: WidgetProps) {
        const widgetProps = mapProps(props)
        return <Widget ket={shortid.generate()} {...widgetProps} />
    }
}
