import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager'

export default class Clipboard {
    public static async writeText(text: string): Promise<void> {
        return writeText(text)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static async writeObject(item: any): Promise<void> {
        return Clipboard.writeText(JSON.stringify(item))
    }

    public static async readText(): Promise<string> {
        return readText()
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static async readObject(): Promise<any> {
        return Clipboard.readText().then((text) =>
            Promise.resolve(JSON.parse(text))
        )
    }
}
