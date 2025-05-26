import React from 'react'

declare module 'react-split-pane-v2' {
    interface Props {
        children: React.ReactNode
    }

    class SplitPane extends React.Component<Props> {}
}
