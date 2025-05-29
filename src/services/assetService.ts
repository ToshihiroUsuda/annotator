import _ from "lodash";
import path from "path-browserify";
import { appInfo } from "../common/appInfo";
import { constants } from "../common/constants";
import Guard from "../common/guard";
import {
  AssetState,
  AssetType,
  IAsset,
  IAssetMetadata,
  IProject,
} from "../models/applicationState";
import { LocalFileSystem } from "../providers/storage/localFileSystem";

export class AssetService {
  private assetDirectory: string;
  private annotationDirectory: string;

  constructor(
    private project: IProject,
    private rootDirectory: string
  ) {
    Guard.null(project);
    this.assetDirectory = path.join(this.rootDirectory, this.project.name);
    this.annotationDirectory = path.join(
      this.rootDirectory,
      this.project.name,
      constants.projectTargetDirectoryName
    );
  }

  public static createAssetFromFileName(fileName: string): IAsset {
    const assetFormat = path.extname(fileName).substring(1);

    const assetType = this.getAssetType(assetFormat);

    return {
      format: assetFormat,
      state: AssetState.NotVisited,
      type: assetType,
      name: fileName,
      size: { width: 0, height: 0 },
    };
  }

  public static getAssetType(format: string): AssetType {
    switch (format.toLowerCase()) {
      case "gif":
      case "jpg":
      case "jpeg":
      case "tif":
      case "tiff":
      case "png":
      case "bmp":
        return AssetType.Image;
      case "mp4":
      case "mov":
      case "avi":
      case "m4v":
      case "mpg":
      case "wmv":
        return AssetType.Video;
      case "tfrecord":
        return AssetType.TFRecord;
      default:
        return AssetType.Unknown;
    }
  }

  public async getAssets(): Promise<IAsset[]> {
    const assets = await LocalFileSystem.getAssets(this.assetDirectory);
    return assets;
  }

  public getChildAssets(rootAsset: IAsset): IAsset[] {
    Guard.null(rootAsset);

    if (rootAsset.type !== AssetType.Video) {
      return [];
    }

    return _.values(this.project.assets).filter(
      (asset) => asset.parent && asset.parent.name === rootAsset.name
    );
    // .sort((a, b) => a.timestamp - b.timestamp);
  }

  public async save(metadata: IAssetMetadata): Promise<IAssetMetadata> {
    Guard.null(metadata);

    const fileName = `${metadata.asset.name}${constants.assetMetadataFileExtension}`;
    const filePath = path.join(this.annotationDirectory, fileName);

    // Only save asset metadata if asset is in a tagged state
    // Otherwise primary asset information is already persisted in the project file.
    if (
      metadata.asset.state === AssetState.Sample ||
      metadata.asset.state === AssetState.Store ||
      metadata.asset.state === AssetState.Freeze ||
      metadata.asset.state === AssetState.FreezeStore ||
      metadata.asset.state === AssetState.Tracked ||
      metadata.asset.state === AssetState.Interpolated ||
      metadata.asset.step
    ) {
      await LocalFileSystem.writeText(
        filePath,
        JSON.stringify(metadata, null, 4)
      );
    } else {
      // If the asset is no longer tagged, then it doesn't contain any regions
      // and the file is not required.
      try {
        await LocalFileSystem.deleteFile(filePath);
      } catch (err) {
        // The file may not exist - that's OK
        // console.warn("thats ok");
        // console.error();
      }
    }
    return metadata;
  }

  public async getAssetMetadata(asset: IAsset): Promise<IAssetMetadata> {
    Guard.null(asset);

    const fileName = `${asset.name}${constants.assetMetadataFileExtension}`;
    const filePath = path.join(this.annotationDirectory, fileName);
    try {
      const json = await LocalFileSystem.readText(filePath);
      return JSON.parse(json) as IAssetMetadata;
    } catch {
      return {
        asset: { ...asset },
        regions: [],
        version: appInfo.version,
      };
    }
  }

  public async deleteTag(tagName: string): Promise<IAssetMetadata[]> {
    const transformer = (tags: string[]) => tags.filter((t) => t !== tagName);
    return await this.getUpdatedAssets(tagName, transformer);
  }

  public async renameTag(
    tagName: string,
    newTagName: string
  ): Promise<IAssetMetadata[]> {
    const transformer = (tags: string[]) =>
      tags.map((t) => (t === tagName ? newTagName : t));
    return await this.getUpdatedAssets(tagName, transformer);
  }

  private async getUpdatedAssets(
    tagName: string,
    transformer: (tags: string[]) => string[]
  ): Promise<IAssetMetadata[]> {
    // Loop over assets and update if necessary
    const updates = await _.values(this.project.assets).mapAsync(
      async (asset) => {
        const assetMetadata = await this.getAssetMetadata(asset);
        const isUpdated = this.updateTagInAssetMetadata(
          assetMetadata,
          tagName,
          transformer
        );

        return isUpdated ? assetMetadata : null;
      }
    );

    return updates.filter((assetMetadata) => !!assetMetadata);
  }

  private updateTagInAssetMetadata(
    assetMetadata: IAssetMetadata,
    tagName: string,
    transformer: (tags: string[]) => string[]
  ): boolean {
    let foundTag = false;

    for (const region of assetMetadata.regions) {
      if (region.tags.find((t) => t === tagName)) {
        foundTag = true;
        region.tags = transformer(region.tags);
      }
    }
    if (foundTag) {
      assetMetadata.regions = assetMetadata.regions.filter(
        (region) => region.tags.length > 0
      );
      // assetMetadata.asset.state = (assetMetadata.regions.length) ? AssetState.Sample : AssetState.Visited;
      return true;
    }

    return false;
  }
}
