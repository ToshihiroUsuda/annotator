import { useSetAtom } from 'jotai'
import { IAppError } from '../../models/applicationState'
import { appErrorAtom } from '../atom'

export interface IAppErrorActions {
    showError(appError: IAppError): void
    clearError(): void
}

const useAppErrorActions = (): IAppErrorActions => {
    const setAppError = useSetAtom(appErrorAtom)
    const appErrorActions: IAppErrorActions = {
        showError: (appError: IAppError) => {
            setAppError(appError)
        },
        clearError: () => {
            setAppError(undefined)
        },
    }
    return appErrorActions
}

export default useAppErrorActions
