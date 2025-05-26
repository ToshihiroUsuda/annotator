import { useSetAtom } from 'jotai'
import { IAppSettings, ITag } from '../../models/applicationState'
import { appSettingsAtom } from '../atom'

export interface IAppSettingsActions {
    saveAppSettings(appSettings: IAppSettings): IAppSettings
}

const useAppSettingsActions = (): IAppSettingsActions => {
    const setAppSettings = useSetAtom(appSettingsAtom)
    const appSettingsActions = {
        saveAppSettings: (appSettings: IAppSettings) => {
            let tags: ITag[] = []
            let tagCategories: string[] = []
            let frameExtractionRate: number = 30
            if (appSettings) {
                if (appSettings.tags) {
                    tags = appSettings.tags.map((tag: ITag) => {
                        return {
                            name: tag.name,
                            dispName: tag.dispName,
                            color: tag.color,
                        }
                    })
                }
                tagCategories =
                    appSettings.tagCategories instanceof Array
                        ? appSettings.tagCategories
                        : [appSettings.tagCategories]
                frameExtractionRate = appSettings.frameExtractionRate || 30
            }
            const newAppSettings = {
                ...appSettings,
                tags,
                tagCategories,
                frameExtractionRate,
            }
            setAppSettings(newAppSettings)
            return newAppSettings
        },
    }
    return appSettingsActions
}

export default useAppSettingsActions
