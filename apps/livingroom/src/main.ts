import express from "express";
import * as path from "path";

const versionNumber = "v2";
const port = process.env.PORT || 3333;

const app = express();

app.use("/assets", express.static(path.join(__dirname, "assets")));

app.get("/api", (req, res) => {
    const serviceVersionHeader = req.headers["x-service-version"]
        ? (req.headers["x-service-version"] as string)
        : "HEADER_NOT_FOUND";

    res.send({
        message: "Welcome to livingroom!",
        versionNumber,
        serviceVersionHeader
    });
});

app.get("/health", (req, res) => {
    res.send({ status: "OK" });
});

const server = app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/api`);
});
server.on("error", console.error);
