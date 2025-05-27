import { App } from "cdk8s";

export class AppWithObjectSynth extends App {
    synthToObjects() {
        const docs: any[] = [];
        for (const chart of this.charts) {
            docs.push(...Object.values(chart.toJson()));
        }
        return docs;
    }
}
