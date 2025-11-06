import { mqttClient, topics } from "@/lib/mqtt/mqttClient";

export async function GET() {
  return new Response(
    new ReadableStream({
      start(controller) {
        const send = (event, data) => {
          controller.enqueue(
            new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        const handleStatus = (topic, message) => {
          if (topic === topics.status) {
            send("status", JSON.parse(message.toString()));
          } else if (topic === topics.active) {
            send("active", { online: message.toString() });
          }
        };

        mqttClient.on("message", handleStatus);

        const heartbeat = setInterval(() => {
          controller.enqueue(new TextEncoder().encode(":\n\n")); // mantener conexión viva
        }, 15000);

        controller.onclose = () => {
          mqttClient.off("message", handleStatus);
          clearInterval(heartbeat);
        };
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    }
  );
}
