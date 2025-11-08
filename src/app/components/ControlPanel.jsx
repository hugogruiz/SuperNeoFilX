"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  subscribeMQTT,
  subscribeMQTTOneTime,
  subscribeOneTimeMQTT,
  unsuscribeMQTT,
  unsuscribeMQTTOneTime,
} from "@/app/api/mqtt/stream/suscribe";
import { PublicarElMensaje } from "@/app/api/mqtt/stream/publish";

export default function ControlPanel() {
  const [tempActual, setTempActual] = useState(0);
  const [tempDeseada, setTempDeseada] = useState(100);
  const [comenzar, setComenzar] = useState(false);
  const [termino, setTermino] = useState(false);
  const [running, setRunning] = useState(false);
  const [calentando, setCalentando] = useState(false);

  const [minutes, setMinutes] = useState(10);
  const [seconds, setSeconds] = useState(0);
  const [milliseconds, setMilliseconds] = useState(0);

  const [timeInput, setTimeInput] = useState(
    `${String(10).padStart(2, "0")}:${String(0).padStart(2, "0")}`
  );
  const [isEditingTime, setIsEditingTime] = useState(false);

  const countdownRef = useRef(null);
  const esPrimeraVez = useRef(true);

  // Mantener vista sincronizada cuando no se está editando
  useEffect(() => {
    if (!isEditingTime) {
      setTimeInput(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
    }
  }, [minutes, seconds, isEditingTime]);

  // Suscripción SSE/MQTT desde ESP32
  useEffect(() => {
    try {
      const client = subscribeMQTT("esp32/enviar", (msg) => {
        const parts = String(msg).split(",");
        if (!parts || parts.length === 0) return;

        if (esPrimeraVez.current) {
          esPrimeraVez.current = false;
          setTempActual(Number(parts[0]) || 0);
          
          setMinutes(Number(parts[1]) || 0);
          setSeconds(Number(parts[2]) || 0);
          setComenzar(Boolean(Number(parts[3])));
          setCalentando(Boolean(Number(parts[4])));
          setTempDeseada(Number(parts[5]) || tempDeseada);
        } else {
          setTempActual(Number(parts[0]) || 0);
          setMinutes(Number(parts[1]) || 0);
          setSeconds(Number(parts[2]) || 0);
        }
      });

      return () => {
        if (client && typeof client.end === "function") client.end(true);
      };
    } catch (err) {
      console.error("Hubo un error:", err);
    }
  }, []);

  // Controladores
  function handleStart() {
    setTermino(false);
    PublicarElMensaje("esp32/control/mov", "1");
    setRunning(true);
    
  }

  function handleResume() {
    PublicarElMensaje("esp32/control/mov", "1");
    setRunning(true);
  }

  function handlePause() {
    PublicarElMensaje("esp32/control/mov", "0");
    setRunning(false);
  }

  function handleStop() {
    PublicarElMensaje("esp32/control/mov", "0");
    setRunning(false);
    setTermino(true);
    clearInterval(countdownRef.current);
    setTimeInput(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
  }

  function handleHeatStart() {
    PublicarElMensaje("esp32/control/temp", tempDeseada.toString());
    setCalentando(true);
    console.log("🔥 Calentamiento iniciado");
  }

  function handleHeatStop() {
    PublicarElMensaje("esp32/control/temp", "25");
    setCalentando(false);
    console.log("Calentamiento detenido");
  }

  function startTimer(mins) {
    setMinutes(Number(mins) || 0);
    setSeconds(0);
    setMilliseconds(0);
    setRunning(true);
  }

  const handleTimeChange = (min, sec) => {
    if (!running) {
      setMinutes(Number(min));
      setSeconds(Number(sec));
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-green-300 rounded-2xl shadow-md text-green-800">
      <h2 className="text-xl font-semibold mb-4">Control del Extractor</h2>

      {/* Temperatura actual */}
      <label className="block text-sm text-green-800">Temperatura Actual</label>
      <input
        className="w-full mt-1 p-2 border rounded-md bg-white"
        readOnly
        value={`${tempActual} °C`}
      />

      {/* Temperatura deseada */}
      <label className="block text-sm text-green-800 mt-4">Temperatura Deseada</label>
      <input
        type="number"
        className="w-full mt-1 p-2 border rounded-md"
        value={tempDeseada}
        onChange={(e) => setTempDeseada(Number(e.target.value))}
      />

      {/* Botones Calentar / Detener Calentamiento */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleHeatStart}
          disabled={calentando}
          className={`flex-1 py-2 rounded-full font-medium text-white ${
            calentando ? "bg-gray-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"
          }`}
        >
          Calentar
        </button>

        <button
          onClick={handleHeatStop}
          disabled={!calentando}
          className={`flex-1 py-2 rounded-full font-medium text-white ${
            !calentando ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          Detener Calentamiento
        </button>
      </div>

      {/* Estado de calentamiento */}
      <p className="text-sm text-green-800 mt-3 font-semibold">
        {calentando ? "Calentando el filamento..." : " Enfriando / detenido."}
      </p>

      {/* Cronómetro */}
      <div className="flex items-center justify-center my-6">
        <div className="w-44 h-44 rounded-full border-4 border-green-700 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold flex items-center justify-center gap-0">
              {/* Campo de tiempo personalizado (type="text" con validación parcial) */}
              <input
                type="text"
                inputMode="numeric"
                placeholder="00:00"
                disabled={running}
                value={timeInput}
                onFocus={() => setIsEditingTime(true)}
                onChange={(e) => {
                  // permitir solo dígitos y ":"; máximo 5 caracteres (MM:SS)
                  let v = e.target.value.replace(/[^\d:]/g, "").slice(0, 5);
                  // actualizar texto inmediatamente para edición fluida
                  setTimeInput(v);
                  // admitir formatos parciales: "1", "12", "12:", "12:3", "12:34"
                  const m = v.match(/^(\d{0,2})(:?)(\d{0,2})$/);
                  if (!m) return;
                  const minPart = m[1] || "";
                  const sep = m[2] || "";
                  const secPart = m[3] || "";

                  if (minPart !== "") {
                    const min = Math.min(59, Number(minPart) || 0);
                    setMinutes(min);
                  } else {
                    setMinutes(0);
                  }

                  if (sep === ":" && secPart !== "") {
                    const sec = Math.min(59, Number(secPart) || 0);
                    setSeconds(sec);
                  } else if (sep === ":" && secPart === "") {
                    setSeconds(0);
                  }
                  // si no hay ":", no tocar seconds (permite editar minutos sin borrar segundos)
                }}
                onBlur={() => {
                  setIsEditingTime(false);
                  setTimeInput(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
                }}
                className={`w-24 text-center bg-transparent border-none outline-none font-mono text-2xl tracking-widest ${
                  running ? "cursor-not-allowed text-gray-400" : "text-green-700 focus:ring-0"
                }`}
              />

              <span className="mx-1 text-2xl text-green-700">:</span>

              <span className="ml-2 text-lg text-green-700">
                .{String(milliseconds).padStart(2, "0")}
              </span>
            </div>

            <div className="text-sm text-green-700 mt-1">Tiempo restante</div>
          </div>
        </div>
      </div>

      {/* Botones de inicio/parada (único botón principal + Detener fijo) */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            if (termino) {
              // Si estaba detenido, empezar de nuevo
              handleStart();
            } else if (!running) {
              // Si está en pausa => reanudar
              handleResume();
            } else {
              // Si está corriendo => pausar
              handlePause();
            }
          }}
          className={`flex-1 py-2 rounded-full text-white ${
            running ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {termino ? "Empezar" : running ? "Pausar" : "Reanudar"}
        </button>

        <button
          onClick={handleStop}
          className={`px-4 py-2 rounded-full border text-red-600 border-red-400`}
        >
          Detener
        </button>
      </div>

      {/* Estado general */}
      <div className="mt-4 text-sm text-green-800">
        <strong>Estado:</strong>{" "}
        {(minutes && seconds) ? "Finalizado ✅" : comenzar ? "En proceso" : calentando ? "Calentando" : "Esperando"}
      </div>

      <div className="mt-4 text-xs text-green-700">
        Temperatura objetivo enviada: {tempDeseada}°C
      </div>
    </div>
  );
}