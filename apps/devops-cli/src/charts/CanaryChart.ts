import { Construct } from "constructs";
import { ApiObject, Chart } from "cdk8s";
import { KubeServiceAccount, KubeDeployment } from "@gitops/cdk8s";
import { Gateway, GatewaySpecListenersAllowedRoutesNamespacesFrom } from "@gitops/cdk8s";
import { Environment } from "../models";

export interface CanaryChartProps {
    envName: string;
    env: Environment;
    envoyImage: string;
    canaryProfile: string;
}

export class CanaryChart extends Chart {
    constructor(scope: Construct, id: string, props: CanaryChartProps) {
        const namespace = `gitops-demo-${props.envName}`;
        super(scope, id, {
            namespace,
            disableResourceNameHashes: true,
        });

        new KubeDeployment(this, "entry-envoy-deployment", {
            metadata: {
                name: "entry-envoy",
            },
            spec: {
                replicas: 1,
                selector: {
                    matchLabels: {
                        app: "entry-envoy",
                    },
                },
                template: {
                    metadata: {
                        labels: {
                            app: "entry-envoy",
                        },
                        annotations: {
                            envDescriptor: JSON.stringify(props.env),
                        },
                    },
                    spec: {
                        containers: [
                            {
                                name: "entry-envoy",
                                image: props.envoyImage,
                                ports: [{ containerPort: 10000 }],
                                env: [
                                    {
                                        name: "SERVICE_VERSION",
                                        value: props.env.latestVersion,
                                    },
                                ],
                            },
                        ],
                    },
                },
            },
        });

        new KubeServiceAccount(this, "entry-envoy-service-account", {
            metadata: {
                name: "entry-envoy",
            },
        });

        new Gateway(this, "gitops-demo-gateway", {
            metadata: {
                name: "gitops-demo-gateway",
                annotations: {
                    "service.beta.kubernetes.io/aws-load-balancer-backend-protocol": "http",
                    // If you want to use HTTPS, uncomment the following lines and set the certificate ARN
                    // "service.beta.kubernetes.io/aws-load-balancer-ssl-cert": ``,
                    // "service.beta.kubernetes.io/aws-load-balancer-ssl-ports": "https",
                },
            },
            spec: {
                gatewayClassName: "istio",
                listeners: [
                    {
                        name: "http",
                        port: 80,
                        protocol: "HTTP",
                        allowedRoutes: {
                            namespaces: {
                                from: GatewaySpecListenersAllowedRoutesNamespacesFrom.SAME,
                            },
                        },
                    },
                    // {
                    //     name: "https",
                    //     port: 443,
                    //     protocol: "HTTP", // This should be set to HTTP as well as the service.beta.kubernetes.io/aws-load-balancer-backend-protocol annotation
                    //     allowedRoutes: {
                    //         namespaces: {
                    //             from: GatewaySpecListenersAllowedRoutesNamespacesFrom.SAME,
                    //         },
                    //     },
                    // },
                ],
            },
        });

        new ApiObject(this, "EntryEnvoyCanary", {
            apiVersion: "flagger.app/v1beta1",
            kind: "Canary",
            metadata: {
                name: "entry-envoy",
                namespace: `gitops-demo-${props.envName}`,
            },
            spec: {
                targetRef: {
                    apiVersion: "apps/v1",
                    kind: "Deployment",
                    name: "entry-envoy",
                },
                progressDeadlineSeconds: 1200,
                service: {
                    port: 80,
                    targetPort: 10000,
                    gatewayRefs: [
                        {
                            name: "gitops-demo-gateway",
                            namespace: `gitops-demo-${props.envName}`,
                        },
                    ],
                },
                analysis: this.getCanaryAnalysis(props.canaryProfile)
            },
        });
    }

    private getCanaryAnalysis(canaryProfile: string) {
        switch (canaryProfile) {
            case "instant":
               return {
                    interval: "1s",
                    threshold: 5,
                    maxWeight: 100,
                    stepWeight: 100,
                    sessionAffinity: {
                        cookieName: "flagger-cookie",
                        maxAge: 21600,
                    },
                    metrics: [],
                    webhooks: [],
                };
            case "fast":
                return {
                        interval: "10s",
                        threshold: 5,
                        maxWeight: 100,
                        stepWeight: 10,
                        sessionAffinity: {
                            cookieName: "flagger-cookie",
                            maxAge: 21600,
                        },
                        metrics: [],
                        webhooks: []
                    };
            case "slow":
                return {
                        interval: "60s",
                        threshold: 5,
                        maxWeight: 100,
                        stepWeight: 20,
                        sessionAffinity: {
                            cookieName: "flagger-cookie",
                            maxAge: 21600,
                        },
                        metrics: [],
                        webhooks: [],
                    };
            default:
                throw new Error(`Unknown canary profile: ${canaryProfile}`);
        }
    }
}
