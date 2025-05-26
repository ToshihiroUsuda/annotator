import { watch, UnwatchFn } from '@tauri-apps/plugin-fs'

export const watchRootDirectory = (
    rootDirectory: string,
    onFileCreated: ((path: string) => void) | ((path: string) => Promise<void>),
    onFileChanged: ((path: string) => void) | ((path: string) => Promise<void>),
    onFileRemoved: ((path: string) => void) | ((path: string) => Promise<void>)
): Promise<UnwatchFn> => {
    return watch(
        rootDirectory,
        (event) => {
            if (event.type === 'any' || event.type === 'other') return
            if ('create' in event.type) {
                onFileCreated(event.paths[0])
                return
            }
            if ('modify' in event.type) {
                onFileChanged(event.paths[0])
                return
            }
            if ('remove' in event.type) {
                onFileRemoved(event.paths[0])
                return
            }
        },
        {
            delayMs: 500,
        }
    )
}
