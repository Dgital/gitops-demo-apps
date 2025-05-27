import { Construct } from "constructs";
import { HttpRoute, HttpRouteSpecRulesMatchesHeadersType } from "@gitops/cdk8s";

interface AppRoutingProps {
    appName: string;
    port: number;
    // The versions array either:
    // - containts one item that matches the latestVersion
    // - containts one item that does not match the latestVersion
    // - contains two items, and one of them matches the latestVersion
    versions: string[];
    latestVersion: string;
}

export class AppRouting extends Construct {
    constructor(scope: Construct, id: string, props: AppRoutingProps) {
        super(scope, id);

        new HttpRoute(this, `${props.appName}-httproutes`, {
            metadata: {
                name: props.appName,
            },
            spec: {
                parentRefs: [
                    {
                        group: "",
                        kind: "Service",
                        name: props.appName,
                        port: props.port,
                    },
                ],
                rules: props.versions.map((version) => ({
                    matches:
                        version === props.latestVersion
                            ? [
                                  {
                                      headers: [
                                          {
                                              type: HttpRouteSpecRulesMatchesHeadersType.EXACT,
                                              name: "x-service-version",
                                              value: version,
                                          },
                                      ],
                                  },
                              ]
                            : undefined,
                    backendRefs: [
                        {
                            name: `${props.appName}-${version}`,
                            port: props.port,
                        },
                    ],
                })),
            },
        });
    }
}
