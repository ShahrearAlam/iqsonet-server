require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require('http');

require("./config/mongoose");
const setupSocketServer = require('./sockets/socketServer');

const app = express();
const server = http.createServer(app);
setupSocketServer(server, app);

app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

require("./config/mongoose");

app.get("/", async (req, res) => {
  res.send("<h2>IQNet API</h2>");
});

const routes = require("./routes");

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}/`);
});
