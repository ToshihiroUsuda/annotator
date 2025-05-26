import { AssetType, IFileInfo } from '../models/applicationState'
import Guard from './guard'

/**
 * Helper class for reading HTML files
 */
export default class HtmlFileReader {
    public static videoAssetFiles = {}

    public static readAsText(file: File): Promise<IFileInfo> {
        Guard.null(file)
        let fileInfo: IFileInfo

        return new Promise<IFileInfo>((resolve, reject) => {
            const reader = new FileReader()
            reader.onerror = reject
            reader.onload = () => {
                if (reader.result) {
                    fileInfo = {
                        content: reader.result,
                        file,
                    }
                    resolve(fileInfo)
                } else {
                    reject()
                }
            }

            try {
                reader.readAsText(file)
            } catch (err) {
                reject(err)
            }
        })
    }

    public static async readAssetAttributes(
        assetPath: string,
        assetType: AssetType
    ): Promise<{ width: number; height: number; duration?: number }> {
        switch (assetType) {
            case AssetType.Image:
                return await this.readImageAttributes(assetPath)
            case AssetType.Video:
                return await this.readVideoAttributes(assetPath)
            // case AssetType.TFRecord:
            //     return await this.readTFRecordAttributes(asset);
            default:
                throw new Error('Asset not supported')
        }
    }

    private static readVideoAttributes(
        url: string
    ): Promise<{ width: number; height: number; duration: number }> {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video') as HTMLVideoElement
            video.onloadedmetadata = () => {
                resolve({
                    width: video.videoWidth,
                    height: video.videoHeight,
                    duration: video.duration,
                })
            }
            video.onerror = reject
            video.src = url
        })
    }

    private static readImageAttributes(
        url: string
    ): Promise<{ width: number; height: number }> {
        return new Promise((resolve, reject) => {
            const image = document.createElement('img') as HTMLImageElement
            image.onload = () => {
                resolve({
                    width: image.naturalWidth,
                    height: image.naturalHeight,
                })
            }
            image.onerror = reject
            image.src = url
        })
    }
}
