"use client";

import React, { useEffect, useState, useRef } from "react";
import { subscribeMQTT, subscribeOneTimeMQTT} from "@/app/api/mqtt/stream/suscribe";
import {PublicarElMensaje} from "@/app/api/mqtt/stream/publish";

export default function ControlPanel() {
  const [tempActual, setTempActual] = useState(0);
  const [tempDeseada, setTempDeseada] = useState(100);
  const [comenzar, setComenzar] = useState(false);
  //const [esPrimeraVez, setEsPrimeraVez] = useState(true);
  const [termino, setTermino] = useState(false);
  const [running, setRunning] = useState(false);
  const [calentando, setCalentando] = useState(false);
  const [minutes, setMinutes] = useState(10);
  const [seconds, setSeconds] = useState(0);
  const [milliseconds, setMilliseconds] = useState(0);
  const countdownRef = useRef(null);

  // 🔹 Escucha de datos del ESP32 vía SSE
//EL esp32 enviara 1-tempref,2-tiempo_min, 3-tiempo_seg, 4-iniciar_mov, calentando
// Para obtener el valor se elejira por indice
let esPrimeraVez = useRef(true);
  useEffect(() => {
    let es = null;
    try{
      if(esPrimeraVez){
        async()=>{
        console.log("Es la primera vez"); 
          const msgPrimeraVez = await subscribeOneTimeMQTT("esp32/enviar");
          console.log("Es la primera vez",msgPrimeraVez);
          if (msgPrimeraVez==undefined) return;
          let mensaje = msgPrimeraVez.split(",");
          if (mensaje.length < 5) return; // seguridad
          console.log("Mensaje primera vezzzzz:", mensaje);
          esPrimeraVez.current = false;
          setTempActual(Number(mensaje[0]));
          setMinutes((Number(mensaje[1])));
          setSeconds((Number(mensaje[2])));
          setComenzar(Boolean(Number(mensaje[3])));
          setCalentando(Boolean(Number(mensaje[4])));
          setTempDeseada(Number(mensaje[5]));
        }
        }
      
      const client = subscribeMQTT("esp32/enviar", (msg) => {
        let mensaje = msg.split(",");
        if (mensaje.length < 5) return; // seguridad
        
        setMinutes((Number(mensaje[1])));
        setSeconds((Number(mensaje[2])));
        setTempActual(Number(mensaje[0]));
      });

      return () => {
    if (client) {
      console.log(" Desconectando MQTT");
      client.end(true);
    }
  };
    }
    catch(err){
      console.error("No se pudo crear EventSource:", err);
    }
    /*try {

      es = new EventSource("/api/mqtt/stream");

      es.onopen = () => console.log("SSE conectado ✅");

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (typeof payload.Temp !== "undefined") setTempActual(payload.Temp);
          if (typeof payload.Termino !== "undefined") setTermino(Boolean(payload.Termino));
          if (typeof payload.Comenzar !== "undefined") setComenzar(Boolean(payload.Comenzar));
          if (typeof payload.Calentando !== "undefined") setCalentando(Boolean(payload.Calentando));
        } catch (err) {
          console.warn("SSE: error parseando mensaje", err);
        }
      };

      es.onerror = (err) => {
        console.error("SSE error ❌", err);
        es.close();
      };
    } catch (err) {
      console.error("No se pudo crear EventSource:", err);
    }

    return () => {
      if (es) es.close();
    };
  */}, []);

  // 🔹 Temporizador interno (solo visual)
  /*
  useEffect(() => {
    if (!running) return;
    countdownRef.current = setInterval(() => {
      setMilliseconds((ms) => {
        if (ms === 0) {
          setSeconds((s) => {
            if (s === 0) {
              setMinutes((m) => {
                if (m === 0) {
                  clearInterval(countdownRef.current);
                  setRunning(false);
                  setTermino(true);
                  sendCommand(tempDeseada, true, false);
                  return 0;
                }
                return m - 1;
              });
              return 59;
            }
            return s - 1;
          });
          return 99;
        }
        return ms - 1;
      });
    }, 10);

    return () => clearInterval(countdownRef.current);
  }, [running, tempDeseada]);
*/
  // 🔹 Envío de comandos MQTT
  async function sendCommand(TempVal, TerminoVal = false, ComenzarVal = true) {
    const payload = {
      Temp: Number(TempVal),
      Termino: Boolean(TerminoVal),
      Comenzar: Boolean(ComenzarVal),
    };

    try {
      const res = await fetch("/api/mqtt/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Error al publicar");
      console.log("Comando MQTT enviado:", payload);
    } catch (err) {
      console.error("Error enviando comando:", err);
    }
  }


  // 🔹 Controles del panel
  function handleStart() {
    if (termino) setTermino(false);
    //sendCommand(tempDeseada, false, true);
    PublicarElMensaje(
    "esp32/control/mov",
    "1"
  );
    //startTimer(minutes || 10);
    setRunning(true);
  }

  function handleStop() {
    //sendCommand(tempActual, false, false);
      PublicarElMensaje(
    "esp32/control/mov","0"
  );
    setRunning(false);
    clearInterval(countdownRef.current);
  }

  function handleHeatStart() {
    //sendCommand(tempDeseada, false, true);
    PublicarElMensaje("esp32/control/temp", tempDeseada.toString());
    console.log("🔥 Calentamiento iniciado");
    setCalentando(true);
  }

  function handleHeatStop() {
    //sendCommand(25, false, false); // Temperatura baja para detener calentamiento
    PublicarElMensaje("esp32/control/temp", "25");
    console.log("Calentamiento detenido");
    setCalentando(false);
  }

  function startTimer(mins) {
    setMinutes(Number(mins) || 0);
    setSeconds(0);
    setMilliseconds(0);
    setRunning(true);
  }

  
  return (
    <div className="max-w-md mx-auto p-6 bg-green-300 rounded-2xl shadow-md text-green-800">
      <h2 className="text-xl font-semibold mb-4">Control del Extractor</h2>

      {/* 🔹 Temperatura actual */}
      <label className="block text-sm text-green-800">Temperatura Actual</label>
      <input
        className="w-full mt-1 p-2 border rounded-md bg-white"
        readOnly
        value={`${tempActual} °C`}
      />

      {/* 🔹 Temperatura deseada */}
      <label className="block text-sm text-green-800 mt-4">Temperatura Deseada</label>
      <input
        type="number"
        className="w-full mt-1 p-2 border rounded-md"
        value={tempDeseada}
        onChange={(e) => setTempDeseada(Number(e.target.value))}
      />

      {/* 🔹 Botones Calentar / Detener Calentamiento */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleHeatStart}
          disabled={calentando}
          className={`flex-1 py-2 rounded-full font-medium text-white ${
            calentando
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-orange-500 hover:bg-orange-600"
          }`}
        >
          Calentar
        </button>

        <button
          onClick={handleHeatStop}
          disabled={!calentando}
          className={`flex-1 py-2 rounded-full font-medium text-white ${
            !calentando
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          Detener Calentamiento
        </button>
      </div>

      {/* 🔹 Estado de calentamiento */}
      <p className="text-sm text-green-800 mt-3 font-semibold">
        {calentando ? "Calentando el filamento..." : " Enfriando / detenido."}
      </p>

      {/* 🔹 Cronómetro */}
      <div className="flex items-center justify-center my-6">
        <div className="w-48 h-48 rounded-full border-4 border-green-700 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}.
              <span className="text-xl">{String(milliseconds).padStart(2, "0")}</span>
            </div>
            <div className="text-sm text-green-700 mt-1">Tiempo restante</div>
          </div>
        </div>
      </div>

      {/* 🔹 Botones de inicio/parada */}
      <div className="flex gap-2">
        <button
          onClick={handleStart}
          disabled={running}
          className={`flex-1 py-2 rounded-full text-white ${
            running ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          Empezar
        </button>
        <button
          onClick={handleStop}
          disabled={!running}
          className={`px-4 py-2 rounded-full border ${
            !running ? "text-gray-400 border-gray-200" : "text-red-600 border-red-400"
          }`}
        >
          Detener
        </button>
      </div>

      {/* 🔹 Estado general */}
      <div className="mt-4 text-sm text-green-800">
        <strong>Estado:</strong>{" "}
        {termino
          ? "Finalizado ✅"
          : comenzar
          ? "En proceso"
          : calentando
          ? "Calentando"
          : "Esperando"}
      </div>

      <div className="mt-4 text-xs text-green-700">
        Temperatura objetivo enviada: {tempDeseada}°C
      </div>
    </div>
  );
}
