import express from "express";
import { Server } from "ws";
import type { Client } from "./client";
import crypto from "crypto";

const PORT: number = Number(process.env.PORT) || 8765;
const INDEX: string = "/index.html";

const clients: Client[] = [];
let projector_idx: number = 0;

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });

//////////// On connection ////////////
wss.on("connection", (ws) => {

  console.log("Client connected");
  // 初回設定 (ws のインスタンスを生成)
  const client: Client = {
    uuid: crypto.randomUUID(),
    role: undefined,
    ws,
    flowerText: "",
    flowerCount: 0,
    flowerSizeRange: [],
    flowerColor: []
  };
  clients.push(client);

  // uuid を返す
  ws.send(JSON.stringify({ type: "initConnection", uuid: client.uuid }));

  // クライアントたちを表示
  // console.log(clients);

  ////////// On Close ////////////
  //
  // 切断した時
  //
  ws.on("close", () => {
    console.log("Client disconnected");
    // クライアント削除
    // clients.splice(clients.indexOf(client), 1);
  });


  ////////// On Message ////////////
  //
  // なんか受信した時
  //
  ws.on("message", (message: string) => {
    console.log("Connecting: ");
    clients.forEach(element => {
      console.log(element.uuid);
    });
    console.log(`Received: ${message}`);
    const json = JSON.parse(message);

    // c と同じuuidを持つクライアントを探す
    let client_idx = clients.findIndex((c) => c.uuid === json.uuid);
    
    if (!clients[client_idx]) {
      console.error("Unknown client.");
      return;
    }
    //
    // json.typeによって分岐
    // 
    switch (json.type) {

      case "initConnection":
        // role を設定する想定です
        clients[client_idx] = { ...clients[client_idx], ...json };
        if (json.role === "projector") {
          projector_idx = client_idx;
          console.log(json.uuid);
        }
        break;

      case "sendFlowerData":
        // 花を設定する
        console.log("sendFlowerData");
        // console.log(client);
        clients[client_idx] = {
          ...clients[client_idx],
          ...json
        };
        // OK
        // console.log(clients[client_idx]);
        // console.log(client);
        // ws.send(JSON.stringify({ type: "sendFlowerData", ...json }));
        break;

      case "onQRscan":
        // 宛先を探す
        const target: Client | undefined = clients.find((c) => c.uuid === json.value);

        if (!target) {
          console.error("Unknown target.");
          ws.send(
            JSON.stringify({ type: "onQRscan", error: "Unknown target" })
          );
          break;
        }

        if (!clients[projector_idx]) {
          console.error("Projector not found.");
          ws.send(
            JSON.stringify({ type: "onQRscan", error: "Projector not found." })
          );
          break;
        }

        // 時刻を決定
        const now = new Date().getTime();
        const lag = 2000;
        const time = Math.ceil((now + lag) / 1000) * 1000;
        // console.log(target);

        // console.log("Num: " + client?.flowerCount);
        target.ws.send(JSON.stringify({ 
          type: "prePlay",
          uuid: target.uuid, 
          startTime: time,
          flowerText: target.flowerText,
          flowerCount: target.flowerCount,
          flowerSizeRange: target.flowerSizeRange,
          flowerColor: target.flowerColor,
        }));

        clients[projector_idx].ws.send(JSON.stringify({ 
          type: "prePlay",
          uuid: target.uuid, 
          startTime: time,
          flowerText: target.flowerText,
          flowerCount: target.flowerCount,
          flowerSizeRange: target.flowerSizeRange,
          flowerColor: target.flowerColor,
        }));

        break;
    }
    // ws.send(JSON.stringify({ message: "Hello from server" }));
  });
});
