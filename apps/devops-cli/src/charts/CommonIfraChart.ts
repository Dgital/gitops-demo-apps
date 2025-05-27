import { Construct } from "constructs";
import { Chart } from "cdk8s";
import { Gateway, KubeNamespace } from "@gitops/cdk8s";

export interface CommonInfraChartProps {
    envName: string;
}

export class CommonInfraChart extends Chart {
    constructor(scope: Construct, id: string, props: CommonInfraChartProps) {
        super(scope, id, {
            namespace: `gitops-demo-${props.envName}`,
            disableResourceNameHashes: true,
        });

        new KubeNamespace(this, "namespace", {
            metadata: {
                name: `gitops-demo-${props.envName}`,
                labels: {
                    "istio.io/dataplane-mode": "ambient",
                    "istio.io/use-waypoint": "waypoint",
                },
            },
        });

        new Gateway(this, "waypoint-gateway", {
            metadata: {
                name: "waypoint",
            },
            spec: {
                gatewayClassName: "istio-waypoint",
                listeners: [
                    {
                        name: "mesh",
                        port: 15008,
                        protocol: "HBONE",
                    },
                ],
            },
        });
    }
}
