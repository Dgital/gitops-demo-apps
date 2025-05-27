import express from "express";
import * as path from "path";

const port = process.env.PORT || 3331;
const kitchenAddress = `http://kitchen:${process.env.KITCHEN_SERVICE_PORT}`;
const livingroomAddress = `http://livingroom:${process.env.LIVINGROOM_SERVICE_PORT}`;
const versionNumber = "v1";

const sendGet = async (url: string, serviceVersion: string) => {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                "x-service-version": serviceVersion
            },
        });

        if (!response.ok) {
            let errorBody = 'Unknown error';
            try {
                errorBody = await response.text();
            } catch (bodyReadError) {
                 errorBody = response.statusText;
            }
            throw new Error(`HTTP error! Status: ${response.status}, StatusText: ${response.statusText}, Body: ${errorBody}`);
        }

        const data = await response.json();

        return data;

    } catch (e) {
        console.log(e);
        return { error: (e as Error).message };
    }
};


const app = express();

app.use("/assets", express.static(path.join(__dirname, "assets")));

app.get("/api", async (req, res) => {
    try {
        const serviceVersion = req.headers["x-service-version"]
            ? (req.headers["x-service-version"] as string)
            : "HEADER_NOT_FOUND";

        const [livingroomResponse, kitchenResponse] = await Promise.all([
            sendGet(`${livingroomAddress}/api`, serviceVersion),
            sendGet(`${kitchenAddress}/api`, serviceVersion)
        ]);
        res.send({
            message: `Welcome to home!`,
            version: versionNumber,
            serviceVersionHeader: serviceVersion,
            livingroom: livingroomResponse,
            kitchen: kitchenResponse,
        });
    } catch (e) {
        res.send({ error: e.message }).status(500);
    }
});

app.get("/health", (req, res) => {
    res.send({ status: "OK" });
});

const server = app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/api`);
});
server.on("error", console.error);
