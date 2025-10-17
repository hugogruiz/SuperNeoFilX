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
