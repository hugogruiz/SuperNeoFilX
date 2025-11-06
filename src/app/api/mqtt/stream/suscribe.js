// lib/mqttClient.js
import mqtt from "mqtt";
import { resolve } from "path";

const brokerUrl = "wss://test.mosquitto.org:8081/mqtt"; // 👈 Usa WebSocket en frontend

let client;

export function subscribeMQTT(topic, onMessage) {
  if (client && client.connected) return client;

  client = mqtt.connect(brokerUrl, {
    clientId: "nextjs_mqtt_client_" + Math.random().toString(16).substr(2, 8),
    clean: true,
    connectTimeout: 4000,
  });

  client.on("connect", () => {
    console.log("✅ Conectado al broker MQTT");
    client.subscribe(topic, (err) => {
      if (!err) console.log(`📡 Suscrito al topic: ${topic}`);
    });
  });

  client.on("message", (topic, message) => {
    const data = message.toString();
    // Llama al callback con el nuevo mensaje
    if (onMessage) onMessage(data);
  });

  client.on("error", (err) => {
    console.error("❌ Error MQTT:", err);
  });

  return client; // Devuelve el cliente, no el mensaje
}

export async function subscribeOneTimeMQTT(topic) {   
  if (client && client.connected) return client;

  client = mqtt.connect(brokerUrl, {
    clientId: "nextjs_mqtt_client_" + Math.random().toString(16).substr(2, 8),
    clean: true,
    connectTimeout: 4000,
  });

  client.on("connect", () => {
    console.log("✅ Conectado al broker MQTT una vez");
    client.subscribe(topic, (err) => {
      if (!err) console.log(`📡 Suscrito al topic: ${topic}`);
    });
  });

  client.on("message", (topic, message) => {
    const data = message.toString();
    
    console.log("Mensaje recibido una vez",data);
    client.end(true);
    resolve(data); // Devuelve el cliente, no el mensaje

    // Llama al callback con el nuevo mensaje
  });


}
