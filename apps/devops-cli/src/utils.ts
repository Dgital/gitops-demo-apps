import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";

export const execAsync = promisify(exec);

export async function deleteDirectory(dirPath: string) {
    if (!checkPathExists(dirPath)) {
        return;
    }
    await fs.rm(dirPath, { recursive: true, force: true });
}

export async function checkPathExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch (error) {
        if (error.code === "ENOENT") {
            return false;
        }
        throw error;
    }
}
