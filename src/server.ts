import express from "express";
import { Server } from "ws";
import type { Client } from "./client";
import crypto from "crypto";

const PORT: number = Number(process.env.PORT) || 8765;
const INDEX: string = "/index.html";

const clients: Client[] = [];

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });

wss.on("connection", (ws) => {
  console.log("Client connected");
  // 初回設定
  const client: Client = {
    uuid: crypto.randomUUID(),
    role: undefined,
    ws,
  };
  clients.push(client);
  ws.send(JSON.stringify({ type: "initConnection", uuid: client.uuid }));
  console.log(clients);

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.splice(clients.indexOf(client), 1);
  });

  ws.on("message", (message: string) => {
    console.log(`Received: ${message}`);
    const json = JSON.parse(message);
    let client = clients.find((c) => c.uuid === json.uuid);
    if (!client) {
      console.error("Clients not found.");
      return;
    }
    // json.typeによって分岐
    switch (json.type) {
      case "initConnection":
        client = { ...client, ...json, state: "init" };
        break;
      case "sendFlowerData":
        client = { ...client, ...json, state: "waiting" };
        ws.send(JSON.stringify({ type: "sendFlowerData", ...json }));
        break;
      case "onQRscan":
        const target = clients.find((c) => c.uuid === json.value);
        if (!target) {
          console.error("Clients not found.");
          ws.send(
            JSON.stringify({ type: "onQRscan", error: "Clients not found" })
          );
          break;
        }
        // 時刻を決定
        const now = new Date().getTime();
        const lag = 2000;
        const time = Math.ceil((now + lag) / 1000) * 1000;
        // 送信
        // QR loaderに送り返す
        ws.send(
          JSON.stringify({
            ...json,
            type: "onQRscan",
            value: target.uuid,
            startTime: time,
          })
        );
        // canvasとSPに送る
        clients.forEach((c) => {
          if (c.uuid === json.value || c.role === "main_canvas") {
            c.ws.send(
              JSON.stringify({
                ...json,
                type: "onQRscan",
                value: target.uuid,
                startTime: time,
              })
            );
          }
        });
        client = { ...client, ...json, state: "QRscanned", startTime: time };
        break;
    }
    ws.send(JSON.stringify({ message: "Hello from server" }));
  });
});
