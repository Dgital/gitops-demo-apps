import simpleGit from "simple-git";
import fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { v6 as uuidv6 } from "uuid";
import { checkPathExists, deleteDirectory } from "./utils";
import { manifestRepoUrl } from "./config";
import { Environment } from "./models";

export const manifestRepoPath = path.join(os.tmpdir(), "devops-cli", uuidv6());

export async function cleanupTempDir() {
    await deleteDirectory(manifestRepoPath);
}

export async function cloneManifestRepo() {
    try {
        console.log(`Cloning to temp directory: ${manifestRepoPath}`);

        // Clean up existing directory if it exists
        if (checkPathExists(manifestRepoPath)) {
            await deleteDirectory(manifestRepoPath);
        }
        await fs.mkdir(manifestRepoPath, { recursive: true });

        // Initialize git and clone
        const git = simpleGit();
        await git.clone(manifestRepoUrl, manifestRepoPath);

        console.log("Repository cloned successfully");
    } catch (error) {
        console.error("Failed to clone repository:", error);
        throw error;
    }
}

export async function createEnvironmentBranch(clusterName: string, envName: string) {
    const branchName = `${clusterName}/${envName}`;
    const git = simpleGit(manifestRepoPath);

    const branches = await git.branch();
    if (branches.all.includes(`remotes/origin/${branchName}`)) {
        throw new Error(`Environment already exists: ${branchName}`);
    }

    await git.branch([branchName]);
    await git.checkout(branchName);
}

export async function checkoutEnvironmentBranch(clusterName: string, envName: string) {
    const branchName = `${clusterName}/${envName}`;
    const git = simpleGit(manifestRepoPath);
    await git.checkout(branchName);
}

export async function deleteEnvironmentBranch(clusterName: string, envName: string) {
    const branchName = `${clusterName}/${envName}`;
    const git = simpleGit(manifestRepoPath);
    await git.push(["origin", "--delete", branchName]);
    console.log(`Successfully deleted environment: ${branchName}`);
}

export async function checkoutManifestRepo(clusterName: string, envName: string, revision: string) {
    const git = simpleGit(manifestRepoPath);
    await git.checkout(revision);
}

export async function loadEnvironmentFromRepo(): Promise<Environment> {
    const envConfigContent = await fs.readFile(path.join(manifestRepoPath, "environment.json"), "utf-8");
    return JSON.parse(envConfigContent) as Environment;
}

export async function saveEnvironment(environment: Environment): Promise<void> {
    const envPath = path.join(manifestRepoPath, "environment.json");

    const dirPath = path.dirname(envPath);
    await fs.mkdir(dirPath, { recursive: true });

    const envConfigContent = JSON.stringify(environment, null, 2);

    await fs.writeFile(envPath, envConfigContent, "utf-8");
}

export async function removeEnvironment(clusterName: string, envName: string) {
    const dirPath = path.join(manifestRepoPath, clusterName, envName);
    await deleteDirectory(dirPath);
}

export async function commitAndPushChangesToManiefestRepo(
    clusterName: string,
    envName: string,
    message: string,
    newBranch: boolean
) {
    try {
        console.log("Committing and pushing changes...");
        const git = simpleGit(manifestRepoPath);

        const status = await git.status();
        if (status.isClean()) {
            console.log("No changes to commit");
            return;
        }

        await git.add(".");
        console.log("Files staged for commit");

        await git.commit(message);
        console.log("Changes committed");

        const branchName = `${clusterName}/${envName}`;
        if (newBranch) {
            await git.push("origin", branchName, ["--set-upstream"]);
        } else {
            await git.push("origin", branchName);
        }

        console.log("Changes pushed to remote repository");
    } catch (error) {
        console.error("Failed to commit and push changes:", error);
        throw error;
    }
}
