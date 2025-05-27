export type AppName = "home" | "kitchen" | "livingroom";

export const appNames: AppName[] = ["home", "kitchen", "livingroom"];

export interface AppVersion {
    name: AppName;
    version: string;
}

export interface Environment {
    apps: AppVersion[];
    latestVersion: string;
}
