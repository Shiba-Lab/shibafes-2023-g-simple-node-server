import express from "express";
import { Server } from "ws";
import path from "path";

const PORT: number = 8765;
const INDEX: string = "/index.html";

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });

// wss.on("connection", (ws) => {
//   console.log("Client connected");
//   ws.on("close", () => console.log("Client disconnected"));
// });

const result = { type: "setup", id: "00000110", role: "canvas" };

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    console.log(`Received: ${message}`);
    ws.send(JSON.stringify({ message: "Hello from server" }));
  });
});

setInterval(() => {
  wss.clients.forEach((client) => {
    client.send(new Date().toTimeString());
  });
}, 1000);
