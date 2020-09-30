const express = require("express")
    , path = require("path")
    , helmet = require("helmet")
    , app = express()
    , enforce = require("express-sslify")
    , fallback = require("express-history-api-fallback")
    , port = process.env.PORT || 9000
    , root = path.resolve(__dirname, "public")

app
    .use(helmet())
    .use(enforce.HTTPS({ trustProtoHeader: true }))
    .use(express.static(root))
    .get("/api/monitor", (_, res) => res.status(200).end())
    .get("/api/ping", (_, res) => res.status(200).end())
    .use(fallback("index.html", { root }))
    .listen(port, () => console.log(`🌎 Server is listening on port ${port}, waiting for requests...`));
