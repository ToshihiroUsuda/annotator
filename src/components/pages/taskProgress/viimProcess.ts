import path from 'path-browserify'
import { normalizeSlashes } from '../../../common/utils'
import { Command } from '@tauri-apps/plugin-shell'
import _ from 'lodash'

const batFiles = {
    load: 'main_load.bat',
    send: 'main_send.bat',
    updateDatabase: 'main_update_database.bat',
    reset: 'main_reset.bat',
} as const

export default class ViimProcess {
    private scriptDirectory: string
    private settingsFile: string
    private processNames: Record<string, number>
    constructor(scriptDirectory: string, settingsFile: string) {
        this.processNames = {}
        this.scriptDirectory = scriptDirectory
        this.settingsFile = settingsFile
    }
    private execute(processName: string, args: string[]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (processName in this.processNames) {
                reject(`Child process "${processName}" is already started`)
            }
            const proc = Command.create(processName, args)

            let stderrData = ''

            proc.stderr.on('data', (data) => {
                stderrData += data.toString()
            })

            proc.on('error', (err) => {
                if (processName in this.processNames)
                    delete this.processNames[processName]
                reject(err)
            })

            proc.on('close', (payload) => {
                if (processName in this.processNames)
                    delete this.processNames[processName]
                if (payload.code === 0) {
                    resolve()
                } else {
                    reject(stderrData)
                }
            })
            proc.spawn().then((child) => {
                this.processNames[processName] = child.pid
            })
        })
    }

    public executeLoad = async () => {
        const batFile = normalizeSlashes(
            path.join(this.scriptDirectory, batFiles['load'])
        )
        const args = ['cmd.exe', '/c', batFile, this.settingsFile]
        await this.execute('load', args)
    }

    public executeSend = async (dstDirectory: string) => {
        const batFile = normalizeSlashes(
            path.join(this.scriptDirectory, batFiles['send'])
        )
        const args = ['cmd.exe', '/c', batFile, this.settingsFile, dstDirectory]
        await this.execute('send', args)
    }

    public executeUpdateDatabase = async (keyValues: string[]) => {
        const batFile = normalizeSlashes(
            path.join(this.scriptDirectory, batFiles['updateDatabase'])
        )
        const args = ['cmd.exe', '/c', batFile, this.settingsFile, ...keyValues]
        await this.execute('update_database', args)
    }

    public executeReset = async () => {
        const batFile = normalizeSlashes(
            path.join(this.scriptDirectory, batFiles['reset'])
        )
        const args = ['cmd.exe', '/c', batFile, this.settingsFile]
        await this.execute('reset', args)
    }

    public kill(processName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const proc = Command.create('kill', [
                '/PID',
                `${this.processNames[processName]}`,
                '/T',
                '/F',
            ])
            proc.spawn()
                .then(() => {
                    resolve()
                })
                .catch(() => {
                    reject(`kill ${this.processNames[processName]} failed`)
                })

            if (processName in this.processNames)
                delete this.processNames[processName]
        })
    }

    public release(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const processes = _.keys(this.processNames).map((name) =>
                this.kill(name)
            )
            Promise.all(processes)
                .then(() => {
                    resolve()
                })
                .catch((e) => {
                    reject(e)
                })
        })
    }
}
