import { IntOrString, KubeDeployment, KubeService, Quantity } from "@gitops/cdk8s";
import { Chart } from "cdk8s";
import { Construct } from "constructs";
import { AppRouting } from "../constructs/AppRouting";
import { config } from "../config";
import { AppName } from "../models";


export interface AppChartContextProps {
    envName: string;
    versions: string[];
    latestVersion: string;
}

export interface AppChartProps extends AppChartContextProps {
    appName: AppName;
    containerPort?: number;
    memoryRequest?: string;
    cpuRequest?: string;
}


export class AppChart extends Chart {
    constructor(scope: Construct, id: string, props: AppChartProps) {
        const {
            envName,
            versions,
            latestVersion,
            appName,
            containerPort = 80,
            memoryRequest = "64Mi",
            cpuRequest = "0m",
        } = props;

        super(scope, id, {
            namespace: `gitops-demo-${envName}`,
        });

        // Deployments and Services for each version
        versions.forEach((version) => {
            const deploymentName = `${appName}-${version}`;
            const containerImage = `ghcr.io/${config.githubRepositoryOwner.toLowerCase()}/gitops-demo-${appName}:sha-${version}`;

            new KubeDeployment(this, `${deploymentName}-deployment`, {
                metadata: {
                    name: deploymentName,
                    labels: {
                        app: appName,
                        version,
                    },
                },
                spec: {
                    replicas: 1,
                    selector: {
                        matchLabels: {
                            app: appName,
                            version,
                        },
                    },
                    template: {
                        metadata: {
                            labels: {
                                app: appName,
                                version,
                            },
                        },
                        spec: {
                            containers: [
                                {
                                    name: deploymentName,
                                    image: containerImage,
                                    ports: [{ containerPort }],
                                    env: [],
                                    resources: {
                                        requests: {
                                            memory: Quantity.fromString(memoryRequest),
                                            cpu: Quantity.fromString(cpuRequest),
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            });

            new KubeService(this, `${deploymentName}-service`, {
                metadata: {
                    name: deploymentName,
                    labels: {
                        app: appName,
                        version,
                    },
                },
                spec: {
                    ports: [
                        {
                            name: "http",
                            port: containerPort,
                            targetPort: IntOrString.fromNumber(containerPort),
                            protocol: "TCP",
                        },
                    ],
                    selector: {
                        app: appName,
                        version,
                    },
                },
            });
        });

        // Main Service that selects all versions (or specific ones via labels)
        // This service is used for routing
        new KubeService(this, `${appName}-service`, {
            metadata: {
                name: appName,
                labels: {
                    app: appName,
                },
            },
            spec: {
                selector: {
                    app: appName,
                },
                ports: [
                    {
                        protocol: "TCP",
                        port: containerPort,
                        targetPort: IntOrString.fromNumber(containerPort),
                    },
                ],
            },
        });

        // Routing rules for the main service
        // This is used to route traffic to the correct version based on the header
        new AppRouting(this, `${appName}-routing`, {
            appName,
            port: containerPort,
            versions,
            latestVersion,
        });
    }
}


