import mqtt from "mqtt";
// 🔧 CONFIGURACIÓN DEL BROKER
// Ejemplo: "mqtt://192.168.1.100:1883"  o  "mqtts://tu-broker.cloud:8883"
const brokerUrl = "wss://test.mosquitto.org:8081/mqtt";

    // Publicar el mensaje MQTT
const options = {
  clientId: "nextjs_client_" + Math.random().toString(16).substr(2, 8),
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
};

// 🚀 CONEXIÓN AL BROKER
const mqttClient = mqtt.connect(brokerUrl, options);

export function PublicarElMensaje(topic, message) {
  try {
    mqttClient.publish(topic, message);
    console.log("Comando MQTT enviado:", { topic, message });
  } catch (error) {
    console.error("❌ Error al publicar MQTT:", error);
   }
}
