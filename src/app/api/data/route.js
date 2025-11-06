/*
import { connectDB } from "@/lib/mongoose";
import Data from "@/models/Data";

export async function GET() {
  await connectDB();
  const data = await Data.find().sort({ fecha: -1 }).limit(10); // últimos 10 registros
  return Response.json(data);
}

export async function POST(request) {
  await connectDB();
  const body = await request.json();
  const saved = await Data.create(body);
  return Response.json({ success: true, data: saved });
}
*/

let espData = {
  Temp: null,
  Termino: false,
  Comenzar: false,
};

// Maneja peticiones GET y POST

export async function GET() {
  return Response.json(espData);
}

export async function POST(request) {
  try {
    const body = await request.json();
    espData = { ...espData, ...body }; // actualiza los datos
    return Response.json({ message: "Datos recibidos correctamente", data: espData });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Error al procesar la solicitud" }), {
      status: 400,
    });
  }
}
