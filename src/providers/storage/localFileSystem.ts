import { join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import {
  exists,
  mkdir,
  readDir,
  readFile,
  readTextFile,
  remove,
  writeFile,
  writeTextFile,
  WriteFileOptions,
} from "@tauri-apps/plugin-fs";
import path from "path-browserify";
import { AssetType, IAsset } from "../../models/applicationState";
import { AssetService } from "../../services/assetService";

/**
 * Options for Local File System
 * @member folderPath - Path to folder being used in provider
 */
export interface ILocalFileSystemOptions {
  folderPath: string;
}

export class LocalFileSystem {
  public static async selectDirectory(
    defaultPath?: string
  ): Promise<string | null> {
    const selected = await open({
      directory: true,
      multiple: false,
      defaultPath: defaultPath,
    });
    if (Array.isArray(selected)) {
      return null;
    } else {
      return selected;
    }
  }

  public static async selectFile(
    defaultPath?: string,
    extension?: "txt" | "json" | "py"
  ): Promise<string | null> {
    const filters = [];
    if (extension) {
      filters.push({
        name: extension.toUpperCase(),
        extensions: [extension],
      });
    }
    const selected = await open({
      directory: false,
      multiple: true,
      defaultPath: defaultPath,
      filters: filters,
    });
    if (Array.isArray(selected)) {
      return null;
    } else {
      return selected;
    }
  }

  public static async readText(filePath: string): Promise<string> {
    return readTextFile(filePath);
  }

  public static async readBinary(filePath: string): Promise<Buffer> {
    const arr = await readFile(filePath);
    return Buffer.from(arr);
  }

  public static async deleteFile(filePath: string): Promise<void> {
    await remove(filePath);
  }

  public static async writeText(
    filePath: string,
    contents: string,
    options?: WriteFileOptions
  ): Promise<void> {
    return writeTextFile(filePath, contents, options);
  }

  public static async writeBinary(
    filePath: string,
    contents: Buffer
  ): Promise<void> {
    return writeFile(filePath, Uint8Array.from(contents));
  }

  public static async listFiles(folderPath: string): Promise<string[]> {
    const entries = await readDir(folderPath);
    return Promise.all(
      entries
        .filter((entry) => entry.isFile)
        .map(async (entry) => await join(entry.name))
    );
  }

  public static async listDirectories(folderPath: string): Promise<string[]> {
    const entries = await readDir(folderPath);
    return Promise.all(
      entries
        .filter((entry) => entry.isDirectory)
        .map(async (entry) => await join(entry.name))
    );
  }

  public static async createDirectory(folderPath: string): Promise<void> {
    if (await exists(folderPath)) {
      return;
    }
    mkdir(folderPath, { recursive: true });
  }

  public static async deleteDirectory(folderPath: string): Promise<void> {
    if (!(await exists(folderPath))) {
      return;
    }
    remove(folderPath, { recursive: true });
  }

  public static async getAssets(folderPath: string): Promise<IAsset[]> {
    return (await this.listFiles(path.normalize(folderPath)))
      .map((filePath) => {
        const fileName = path.basename(filePath);
        return AssetService.createAssetFromFileName(fileName);
      })
      .filter((asset) => asset.type !== AssetType.Unknown);
  }

  public static async exists(path: string): Promise<boolean> {
    return await exists(path);
  }
}
