import React from 'react'
import { NavLink } from 'react-router-dom'

interface IConditionalNavLinkProps extends React.PropsWithChildren {
    to: string
    title: string
    disabled: boolean
}

const ConditionalNavLink: React.FC<IConditionalNavLinkProps> = ({
    to,
    disabled,
    title,
    children,
}) => {
    if (disabled) {
        return (
            <span className="disabled" title={title}>
                {children}
            </span>
        )
    } else {
        return (
            <NavLink title={title} to={to}>
                {children}
            </NavLink>
        )
    }
}

export default ConditionalNavLink
