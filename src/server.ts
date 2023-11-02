import express from "express";
import { Server as WebSocketServer } from "ws";
import http from "http";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const result = { type: "setup", id: "00000110", role: "canvas" };

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    console.log(`Received: ${message}`);
    ws.send(JSON.stringify({ message: "Hello from server" }));
  });
});

const PORT = 8765;
server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
