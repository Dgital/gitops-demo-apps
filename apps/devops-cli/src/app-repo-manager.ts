import { AppName, appNames } from "./models";
import simpleGit from "simple-git";
import { execAsync } from "./utils";

export async function getCurrentGitCommitHash(): Promise<string> {
    const git = simpleGit();
    return await git.revparse(["HEAD"]);
}

async function isAncestor(ancestor: string, descendant: string) {
  try {
    const git = simpleGit();
    const mergeBase = await git.raw(['merge-base', ancestor, descendant]);
    return mergeBase.trim() === ancestor;
  } catch {
    return false;
  }
}

export async function getAffectedProjects(
    previousDeployment: string,
    latestDeployment: string | null
): Promise<AppName[]> {
    if (!previousDeployment) {
        console.log("No previous deployment found, all apps should be deployed.");
        return appNames;
    }

    if (!(await isAncestor(previousDeployment, latestDeployment))) {
        console.log("Previous deployment is not an ancestor of the latest deployment, all apps should be deployed.");
        return appNames;
    }

    return  await affectedProjectsBetweenTwoCommits(previousDeployment, latestDeployment);
}

async function affectedProjectsBetweenTwoCommits(base: string, head: string): Promise<AppName[]> {
    const { stdout } = await execAsync(`pnpm nx show projects --affected --base=${base} --head=${head}`);
    return stdout
        .split("\n")
        .map((l) => l.trim() as AppName)
        .filter((l) => l.length > 0 && appNames.includes(l)) as AppName[];
}
