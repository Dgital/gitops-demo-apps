import { AppName, AppVersion, Environment } from "./models";
import * as fs from "fs/promises";
import { deleteDirectory } from "./utils";
import { App } from "cdk8s";
import { CommonInfraChart } from "./charts/CommonIfraChart";
import { CanaryChart } from "./charts/CanaryChart";
import { config } from "./config";
import * as path from "path";
import * as manifestRepoManager from "./manifest-repo-manager";
import { manifestRepoPath } from "./manifest-repo-manager";
import { AppChartFactory } from "./charts/AppChartFactory";

export async function createEnvironment() {
    const config: Environment = {
        apps: [],
        latestVersion: null,
    };
    try {
        const filePath = path.join(manifestRepoPath, "environment.json");

        await fs.writeFile(filePath, JSON.stringify(config, null, 2), "utf-8");
        console.log(`Environment created successfully at ${filePath}`);
        return config;
    } catch (error) {
        console.error(`Error creating environment: ${error.message}`);
        throw error;
    }
}

function cleanupOldVersions(environment: Environment): Environment {
    if (!environment.latestVersion) {
        throw new Error("No latest version found in the environment. Nothing to finalize.");
    }

    // Get all app names that have the same version as the latest version
    const appsWithLatestVersion = environment.apps
        .filter((app) => app.version === environment.latestVersion)
        .map((app) => app.name);

    return {
        ...environment,
        apps: (environment.apps = environment.apps.filter(
            (app) => !appsWithLatestVersion.includes(app.name) || app.version === environment.latestVersion
        )),
    };
}

export async function addNewVersion(
    originalEnvironment: Environment,
    checkedoutVersion: string,
    affectedProjects: AppName[]
) {
    let newEnvironment = originalEnvironment;
    if (originalEnvironment.latestVersion) {
        newEnvironment = cleanupOldVersions(originalEnvironment);
    }

    const newAppVersions: AppVersion[] = affectedProjects.map((appName) => ({
        name: appName,
        version: checkedoutVersion,
    }));

    newEnvironment = {
        apps: [...newAppVersions, ...newEnvironment.apps],
        latestVersion: checkedoutVersion,
    };

    await manifestRepoManager.saveEnvironment(newEnvironment);
}

export async function finalize(originalEnvironment: Environment) {
    const newEnvironment = cleanupOldVersions(originalEnvironment);
    await manifestRepoManager.saveEnvironment(newEnvironment);
}


export async function updateManifests(envName: string) {
    const environment = await manifestRepoManager.loadEnvironmentFromRepo();

    const pathName = path.join(manifestRepoManager.manifestRepoPath, "manifests");
    await deleteDirectory(pathName);
    const app = new App({ outdir: pathName });

    // Common infrastructure
    const commonInfra = new CommonInfraChart(app, "common-infra", {
        envName,
    });

    // Applications
    const appNames = [...new Set(environment.apps.map((a) => a.name))];
    const appCharts = appNames.map((appName) => {
        const appVersions = environment.apps.filter((a) => a.name === appName).map((a) => a.version);

        const chart = AppChartFactory.createAppChart(app, appName, {
            envName,
            versions: appVersions,
            latestVersion: environment.latestVersion
        });
        chart.addDependency(commonInfra);
        return chart;
    });

    // Canary
    const canary = new CanaryChart(app, "canary", {
        envName,
        env: environment,
        envoyImage: config.entryEnvoyImage,
        canaryProfile: config.canaryProfile,
    });
    canary.addDependency(commonInfra);
    appCharts.forEach((chart) => canary.addDependency(chart));

    app.synth();
}
