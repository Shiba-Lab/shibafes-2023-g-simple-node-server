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

//////////// On connection ////////////
wss.on("connection", (ws) => {

  console.log("Client connected");
  // 初回設定 (ws のインスタンスを生成)
  const client: Client = {
    uuid: crypto.randomUUID(),
    role: undefined,
    ws,
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
    clients.splice(clients.indexOf(client), 1);
  });


  ////////// On Message ////////////
  //
  // なんか受信した時
  //
  ws.on("message", (message: string) => {
    console.log(`Received: ${message}`);
    const json = JSON.parse(message);

    // c と同じuuidを持つクライアントを探す
    let client = clients.find((c) => c.uuid === json.uuid);
    
    if (!client) {
      console.error("Unknown client.");
      return;
    }

    //
    // json.typeによって分岐
    // 
    switch (json.type) {

      case "initConnection":
        // role を設定する想定です
        client = { ...client, ...json };
        console.log(client);
        break;

      case "onQRscan":
        // 宛先を探す
        const target = clients.find((c) => c.uuid === json.value);

        if (!target) {
          console.error("Unknown target.");
          ws.send(
            JSON.stringify({ type: "onQRscan", error: "Unknown target" })
          );
          break;
        }
        // 時刻を決定
        const now = new Date().getTime();
        const lag = 2000;
        const time = Math.ceil((now + lag) / 1000) * 1000;

        // TODO: Next たちに送信

      // case "sendFlowerData":
      //   client = { ...client, ...json, state: "waiting" };
      //   ws.send(JSON.stringify({ type: "sendFlowerData", ...json }));
      //   break;
        // 送信
        // QR loaderに送り返す
        // ws.send(
        //   JSON.stringify({
        //     ...json,
        //     type: "onQRscan",
        //     value: target.uuid,
        //     startTime: time,
        //   })
        // );
        // canvasとSPに送る
        // clients.forEach((c) => {
        //   if (c.uuid === json.value || c.role === "main_canvas") {
        //     c.ws.send(
        //       JSON.stringify({
        //         ...json,
        //         type: "onQRscan",
        //         value: target.uuid,
        //         startTime: time,
        //       })
        //     );
        //   }
        // });
        // client = { ...client, ...json, state: "QRscanned", startTime: time };
        break;
    }
    // ws.send(JSON.stringify({ message: "Hello from server" }));
  });
});
