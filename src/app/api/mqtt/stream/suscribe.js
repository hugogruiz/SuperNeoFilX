// lib/mqttClient.js
import { rejects } from "assert";
import mqtt from "mqtt";
import { resolve } from "path";

const brokerUrl = "wss://test.mosquitto.org:8081/mqtt"; // Usa WebSocket en frontend

let client;
let clienteUnaVez;

export function subscribeMQTT(topic, onMessage) {
  if (client && client.connected) return client;

  client = mqtt.connect(brokerUrl, {
    clientId: "nextjs_mqtt_client_" + Math.random().toString(16).substr(2, 8),
    clean: true,
    connectTimeout: 4000,
  });

  client.on("connect", () => {
    console.log("Conectado al broker MQTT");
    client.subscribe(topic, (err) => {
      if (!err) console.log('Suscrito al topic: ${topic}');
    });
  });

  client.on("message", (topic, message) => {
    const data = message.toString();
    // Llama al callback con el nuevo mensaje
    if (onMessage) onMessage(data);
  });

  client.on("error", (err) => {
    console.error("Error MQTT:", err);
  });

  return client; // Devuelve el cliente, no el mensaje
}


export function subscribeMQTTOneTime(topic, onMessage) {
  if (clienteUnaVez && clienteUnaVez.connected) return clienteUnaVez;

  clienteUnaVez = mqtt.connect(brokerUrl, {
    clientId: "nextjs_mqtt_client_" + Math.random().toString(16).substr(2, 8),
    clean: true,
    connectTimeout: 4000,
  });

  clienteUnaVez.on("connect", () => {
    console.log("Conectado al broker MQTT");
    clienteUnaVez.subscribe(topic, (err) => {
      if (!err) console.log('Suscrito al topic: ${topic}');
    });
  });

  clienteUnaVez.once("message", (msgTopic, message) => {
    if (msgTopic === topic) {
      const data = message.toString();
      console.log('Mensaje recibido en ${topic}: ${data}');

      if (onMessage) onMessage(data);

      // Desuscribirse y cerrar conexión
      clienteUnaVez.unsubscribe(topic, () => {
        console.log('Desuscrito de ${topic}');
        clienteUnaVez.end();
        clienteUnaVez = null;
      });
    }
  });


  return clienteUnaVez; // Devuelve el cliente, no el mensaje
}

export function unsuscribeMQTT() {
  client.end(true);
}

export function unsuscribeMQTTOneTime() {
  if (clienteUnaVez) {


    clienteUnaVez.unsubscribe(topic, () => {
      console.log('Desuscrito de ${topic}');
    });
    clienteUnaVez.end()
  }
}