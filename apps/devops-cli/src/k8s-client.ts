import * as k8s from "@kubernetes/client-node";
import { V1Deployment } from "@kubernetes/client-node";
import { Environment } from "./models";

export const kc = new k8s.KubeConfig();
try {
    if (process.env.IN_CLUSTER === "true") {
        kc.loadFromCluster();
    } else {
        kc.loadFromDefault();
    }
} catch (error) {
    console.error("Failed to load Kubernetes configuration:", error);
    throw new Error("Cannot initialize Kubernetes client configuration");
}

const appsV1Api = kc.makeApiClient(k8s.AppsV1Api);
const customObjectsApi = kc.makeApiClient(k8s.CustomObjectsApi);

async function getDeployment(namespace: string, name: string) {
    try {
        const response = await appsV1Api.readNamespacedDeployment(name, namespace);
        return response.body;
    } catch (error) {
        if (error.response?.statusCode === 404) {
            return null;
        }
        console.error(`Error getting deployment ${namespace}/${name}:`, error.body || error.message);
        throw error;
    }
}

async function getFluxKustomization(namespace: string, name: string) {
    const group = "kustomize.toolkit.fluxcd.io";
    const version = "v1"; // Using only the current v1 version
    const plural = "kustomizations";
    return getCustomResource(group, version, namespace, plural, name);
}

async function getCustomResource(group: string, version: string, namespace: string, plural: string, name: string) {
    try {
        const response = await customObjectsApi.getNamespacedCustomObject(group, version, namespace, plural, name);
        return response.body;
    } catch (error) {
        if (error.response?.statusCode === 404) {
            return null;
        }
        console.error(`Error getting ${plural} resource ${namespace}/${name}:`, error.body || error.message || error);
        throw error;
    }
}

function isKustomizationReconciled(kustomizationResource) {
    if (!kustomizationResource.status || !kustomizationResource.status.conditions) {
        return false;
    }

    const readyCondition = kustomizationResource.status.conditions.find((condition) => condition.type === "Ready");

    if (!readyCondition) {
        return false;
    }

    return readyCondition.status === "True" && readyCondition.reason === "ReconciliationSucceeded";
}

function getEnvrionmentDescriptorFromDeplyoment(deployment: V1Deployment): Environment | null {
    const annotations = deployment.spec?.template?.metadata?.annotations;

    return annotations?.envDescriptor ? JSON.parse(annotations.envDescriptor) : null;
}

export async function getCurrentlyDeployedEnvrionmentDescriptor(clusterName: string, envName: string) {
    const kustomizationName = `${clusterName}-${envName}`;
    const kustomization = await getFluxKustomization("flux-system", kustomizationName);
    if (!kustomization) {
        throw new Error(`Kustomization ${kustomizationName} not found`);
    }
    if (!isKustomizationReconciled(kustomization)) {
        throw new Error(`Kustomization ${kustomizationName} is not reconciled yet`);
    }

    const deploymentName = "entry-envoy-primary";
    const deploymentNamespace = `gitops-demo-${envName}`;
    const deployment = await getDeployment(deploymentNamespace, deploymentName);
    if (!deployment) {
        throw new Error(`Deployment ${deploymentName} not found in namespace ${deploymentNamespace}`);
    }

    const environtment = getEnvrionmentDescriptorFromDeplyoment(deployment);
    if (!environtment) {
        throw new Error(`Environment descriptor annotation not found in deployment ${deploymentName}`);
    }

    return environtment;
}

export async function getCanary(namespace: string, name: string) {
    const group = "flagger.app";
    const version = "v1beta1";
    const plural = "canaries";
    return getCustomResource(group, version, namespace, plural, name);
}

export function isCanarySucceeded(canaryResource) {
    if (!canaryResource.status || !canaryResource.status.conditions) {
        return false;
    }

    const succeededCondition = canaryResource.status.conditions.find((condition) => condition.type === "Promoted");

    // If no Promoted condition exists, canary promotion hasn't completed successfully
    if (!succeededCondition) {
        return false;
    }

    return succeededCondition.status === "True" && succeededCondition.reason === "Succeeded";
}
