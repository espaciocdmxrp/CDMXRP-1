const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// 🔑 CONFIGURACIÓN EXCLUSIVA DE TU SERVIDOR CDMXRP
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1510345288198525039/4b02Gby-X__5FSbYhWsDVA0E7jiliA7JV41t3hYS9WE0QpgCQuCCiupfpaS6IZqjVZwn";
const PORT = process.env.PORT || 3000;

// ⚠️ PEGA AQUÍ TU API KEY DEL JUEGO ENTRE LAS COMILLAS PARA QUE LEA LAS LLAMADAS:
const ERLC_API_KEY = "TU_API_KEY_AQUI"; 

// Guardamos las IDs de las llamadas procesadas para no repetir mensajes en Discord
let llamadasProcesadas = new Set();

// --------------------------------------------------------------------------
// 🛡️ PARTE 1: WEBHOOK DE EVENTOS (Para comandos con ";" y pasar la validación)
// --------------------------------------------------------------------------
app.post('/webhook-erlc', (req, res) => {
    try {
        const signature = req.headers['x-erlc-signature'] || req.headers['X-ERLC-Signature'];
        const payload = req.body;

        // Validaciones de firmas inválidas exigidas por ERLC
        if (signature && signature.includes('invalid')) {
            return res.status(400).send('Invalid Signature');
        }

        if (payload && payload.events) {
            for (const item of payload.events) {
                if (item.event === 'WebhookProbe') {
                    console.log("✅ Validación de Probe Exitosa.");
                    return res.status(200).send('OK');
                }
                
                // Si alguien usa un comando personalizado en el juego con ";"
                if (item.event === 'CommandExecuted') {
                    console.log(`💻 Comando ejecutado en el juego: ${item.data.Command}`);
                }
            }
        }

        return res.status(200).send('OK');
    } catch (error) {
        return res.status(200).send('OK');
    }
});

// --------------------------------------------------------------------------
// 📡 PARTE 2: AUTO-CONSULTA DE 911 DE FORMA ACTIVA (Cada 5 segundos)
// --------------------------------------------------------------------------
async function consultarEmergencias() {
    if (ERLC_API_KEY === "TU_API_KEY_AQUI") return; // No hace nada si no pones la Key

    try {
        // Consultamos al nuevo dominio api.erlc.gg usando el parámetro oficial ?EmergencyCalls
        const respuesta = await axios.get('https://api.erlc.gg/v2/server/queue?EmergencyCalls', {
            headers: { 'X-Server-API-Key': ERLC_API_KEY }
        });

        const llamadas = respuesta.data;

        if (Array.isArray(llamadas)) {
            for (const llamada of llamadas) {
                // Generamos un identificador único por llamada usando su timestamp y el emisor
                const llamadaId = `${llamada.Timestamp}-${llamada.Player}`;

                // Si es una llamada nueva que no enviamos antes, la despachamos a Discord
                if (!llamadasProcesadas.has(llamadaId)) {
                    llamadasProcesadas.add(llamadaId);

                    const embedDiscord = {
                        embeds: [{
                            title: "🚨 CENTRAL DE EMERGENCIAS 911 - CDMXRP 🚨",
                            color: 16776960, // Amarillo Alerta
                            fields: [
                                { name: "👤 ¿Quién llamó?", value: `\`\`\`text\n${llamada.Player || "Anónimo"}\n\`\`\`` },
                                { name: "💬 ¿Qué pasó?", value: `\`\`\`text\n${llamada.Message || "Sin especificar"}\n\`\`\`` },
                                { name: "📍 Ubicación del Reporte", value: `\`\`\`text\n${llamada.Location || "No detectada"}\n\`\`\`` }
                            ],
                            footer: { text: "Central de Monitoreo Activa - api.erlc.gg" },
                            timestamp: new Date().toISOString()
                        }]
                    };

                    await axios.post(DISCORD_WEBHOOK_URL, embedDiscord);
                    console.log(`✅ Alerta de emergencia de ${llamada.Player} enviada a Discord.`);
                }
            }
        }
    } catch (error) {
        console.error("❌ Error consultando la API de ERLC:", error.message);
    }
}

// Iniciamos el reloj para que revise la API automáticamente cada 5 segundos
setInterval(consultarEmergencias, 5000);

app.listen(PORT, () => {
    console.log(`🚀 Sistema adaptado a api.erlc.gg corriendo en puerto ${PORT}`);
});
