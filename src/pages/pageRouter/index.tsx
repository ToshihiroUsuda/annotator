import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSettings } from '../../atom/state'

import { AppMode } from '../../models/applicationState'

const PageRouter: React.FC = () => {
    const navigate = useNavigate()
    const appSettings = useAppSettings()

    useEffect(() => {
        if (appSettings.rootDirectory === '') {
            navigate('/settings')
            return
        }
        switch (appSettings.appMode) {
            case AppMode.Hospital:
                navigate('/hospital-home')
                break
            case AppMode.Internal:
            case AppMode.Examination:
                navigate('/internal-home')
                break
            default:
                navigate('/settings')
                break
        }
    }, [])

    return <div>Loading...</div>
}

export default PageRouter
