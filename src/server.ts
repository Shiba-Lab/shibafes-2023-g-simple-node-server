import express from "express";
import { Server as WebSocketServer } from "ws";
import http from "http";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    console.log(`Received: ${message}`);
    ws.send(`Echo: ${message}`);
  });
});

const PORT = 8765;
server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
