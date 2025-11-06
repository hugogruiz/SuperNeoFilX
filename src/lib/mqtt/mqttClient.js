import mqtt from "mqtt";
// 🔧 CONFIGURACIÓN DEL BROKER
// Ejemplo: "mqtt://192.168.1.100:1883"  o  "mqtts://tu-broker.cloud:8883"
const brokerUrl = "wss://test.mosquitto.org:8081/mqtt";

// Opciones de conexión (puedes agregar usuario/contraseña si aplica)
/*
const options = {
  clientId: "extractor-server-" + Math.random().toString(16).substr(2, 8),
  clean: true,
  connectTimeout: 4000,
  username: "USUARIO_SI_TIENE",
  password: "CONTRASEÑA_SI_TIENE",
};*/

// Conectamos el cliente MQTT
export const mqttClient = mqtt.connect(brokerUrl, options);

// Suscribimos a los tópicos que usará tu sistema
export const topics = {
    control: "esp32/control", // Web → ESP32
  status: "esp32/status",   // ESP32 → Web
  active: "extractor/active",   // ESP32 → Web (presencia)
};

// Logs útiles
mqttClient.on("connect", () => {
  console.log("✅ Conectado al broker MQTT:", brokerUrl);
  mqttClient.subscribe([topics.status, topics.active], (err) => {
    if (!err) console.log("📡 Suscrito a:", topics.status, "y", topics.active);
  });
});


mqttClient.on("error", (err) => {
  console.error("❌ Error MQTT:", err.message);
});
/*
const brokerUrl = "mqtt://test.mosquitto.org"; // Puedes cambiarlo por tu propio broker
const topicComando = "extractor/comando";
const topicEstado = "extractor/estado";

// Crea el cliente MQTT
const client = mqtt.connect(brokerUrl, {
  clientId: "nextjs_extractor_server_" + Math.random().toString(16).slice(2),
});

// Eventos básicos
client.on("connect", () => {
  console.log("✅ Conectado al broker MQTT:", brokerUrl);
  client.subscribe(topicEstado, (err) => {
    if (!err) {
      console.log("📡 Suscrito al topic de estado:", topicEstado);
    }
  });
});

client.on("message", (topic, message) => {
  console.log(`📥 Mensaje recibido en ${topic}:`, message.toString());
});

client.on("error", (err) => {
  console.error("❌ Error en MQTT:", err);
});

export const mqttClient = client;
export const topics = { topicComando, topicEstado };
*/