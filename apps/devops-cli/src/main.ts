import { inspect } from "util";
import * as manifestRepoManager from "./manifest-repo-manager";
import * as dockerManager from "./docker-manager";
import * as environmentDescriptorManager from "./environment-descriptor-manager";
import * as k8sClient from "./k8s-client";
import { appNames } from "./models";
import * as appRepoManager from "./app-repo-manager";

import { config } from "./config";

const USAGE_HELP = "Usage: pnpm nx run devops-cli:run <command> <clusterName> <envName>";

(async () => {
    const [_, _scriptPath, command] = process.argv;
    const { clusterName, envName } = config;
    let statusCode = 0;
    try {
        switch (command) {
            case "init-env-branch": {
                await manifestRepoManager.cloneManifestRepo();
                await manifestRepoManager.createEnvironmentBranch(clusterName, envName);
                await environmentDescriptorManager.createEnvironment();
                await environmentDescriptorManager.updateManifests(envName);

                const message = `Add new env ${clusterName}/${envName}`;
                await manifestRepoManager.commitAndPushChangesToManiefestRepo(clusterName, envName, message, true);
                break;
            }
            case "delete-env": {
                await manifestRepoManager.cloneManifestRepo();
                await manifestRepoManager.deleteEnvironmentBranch(clusterName, envName);

                break;
            }
            case "new-version": {
                await manifestRepoManager.cloneManifestRepo();
                await manifestRepoManager.checkoutEnvironmentBranch(clusterName, envName);

                const originalEnvironment = await k8sClient.getCurrentlyDeployedEnvrionmentDescriptor(
                    clusterName,
                    envName
                );

                const checkedoutVersion = await appRepoManager.getCurrentGitCommitHash();

                if (checkedoutVersion === originalEnvironment.latestVersion) {
                    console.log("The current commit is already deployed.");
                    break;
                }

                const affectedProjects = originalEnvironment.latestVersion
                    ? await appRepoManager.getAffectedProjects(originalEnvironment.latestVersion, checkedoutVersion)
                    : appNames;

                if (affectedProjects.length === 0) {
                    console.log("No new version to deploy");
                    break;
                }

                await dockerManager.dockerBuild(checkedoutVersion, affectedProjects);
                await environmentDescriptorManager.addNewVersion(
                    originalEnvironment,
                    checkedoutVersion,
                    affectedProjects
                );

                await environmentDescriptorManager.updateManifests(envName);

                const message = `Add new version to ${clusterName}/${envName}`;
                await manifestRepoManager.commitAndPushChangesToManiefestRepo(clusterName, envName, message, false);
                break;
            }
            case "finalize": {
                const canary = await k8sClient.getCanary(`gitops-demo-${envName}`, "entry-envoy");
                if (!k8sClient.isCanarySucceeded(canary)) {
                    console.error("Only environments ucceded canaries can be finalized manually.");
                    statusCode = 1;
                    break;
                }

                await manifestRepoManager.cloneManifestRepo();
                await manifestRepoManager.checkoutEnvironmentBranch(clusterName, envName);

                const originalEnvironment = await k8sClient.getCurrentlyDeployedEnvrionmentDescriptor(
                    clusterName,
                    envName
                );

                await environmentDescriptorManager.finalize(originalEnvironment);
                await environmentDescriptorManager.updateManifests(envName);

                const message = `Finalize new version on ${clusterName}/${envName}`;
                await manifestRepoManager.commitAndPushChangesToManiefestRepo(clusterName, envName, message, false);

                break;
            }
            default: {
                console.error(`Invalid command ${command}. Usage: ${USAGE_HELP}`);
                statusCode = 1;
            }
        }
    } catch (e) {
        console.error(inspect(e));
        statusCode = 1;
    } finally {
        await manifestRepoManager.cleanupTempDir();
    }

    process.exit(statusCode);
})();
