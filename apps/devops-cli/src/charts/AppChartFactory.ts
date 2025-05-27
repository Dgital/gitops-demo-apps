import { Construct } from "constructs";
import { AppName } from "../models";
import { AppChartContextProps, AppChart } from "./AppChart";


export class AppChartFactory {
    public static createAppChart(
        scope: Construct,
        appName: AppName,
        contextProps: AppChartContextProps
    ): AppChart {
        switch (appName) {
            case "home":
                return new AppChart(scope, appName, {
                    ...contextProps,
                    appName: "home",
                });
            case "kitchen":
                return new AppChart(scope, appName, {
                    ...contextProps,
                    appName: "kitchen",
                });
            case "livingroom":
                return new AppChart(scope, appName, {
                    ...contextProps,
                    appName: "livingroom",
                });
            default:
                throw new Error(`Creating AppChart using default settings for app: ${appName}`);
                break;
        }
    }
}
