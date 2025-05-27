import { inspect } from "util";
import { execAsync } from "./utils";
import { config } from "./config";
import { AppName } from "./models";

export async function dockerBuild(version: string, affectedProjects: AppName[]): Promise<void> {
    try {
        // Build Docker images
        const promises = affectedProjects.map(async (project) => {
            const repositoryBasePath = `ghcr.io/${config.githubRepositoryOwner.toLowerCase()}`;
            if (await imageExists(`${repositoryBasePath}/gitops-demo-${project}:sha-${version}`)) {
                console.log(`Docker image for ${project} already exists. Skipping build.`);
                return;
            }

            console.log(`Building and pushing Docker image for ${project}...`);
            await execAsync(`pnpm nx run ${project}:container`);
        });

        await Promise.all(promises);
    } catch (e) {
        console.error("Error building Docker images");
        console.error(inspect(e));
        process.exit(1);
    }
}

async function imageExists(imageUrl: string): Promise<boolean> {
    try {
      await execAsync(`docker manifest inspect ${imageUrl}`);
      return true;
    } catch (error) {
      return false;
    }
  }
