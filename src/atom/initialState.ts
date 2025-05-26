import {
    IApplicationState,
    IAppSettings,
    AppMode,
} from '../models/applicationState'

export const initialAppSettings: IAppSettings = {
    rootDirectory: '',
    tags: [],
    tagCategories: [],
    regionInformationSchema: '',
    stepInformationSchema: '',
    instructionDirectory: '',
    appMode: AppMode.Internal,
    timingsFile: 'all',
    viimScript: '',
    viimSetting: '',
    reportSchema: '',
    confirmStepInfoInput: false,
    frameExtractionRate: 30,
}

const initialState: IApplicationState = {
    appSettings: { ...initialAppSettings },
    recentProjects: [],
    recentReports: [],
}

export default initialState
