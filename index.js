const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// 🔒 VARIABLES OCULTAS EN RENDER
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK;
const ERLC_API_KEY = process.env.ERLC_KEY; 
const PORT = process.env.PORT || 3000;

// Registro para no duplicar las alertas en Discord
let llamadasProcesadas = new Set();

// --------------------------------------------------------------------------
// 🛡️ WEBHOOK DE EVENTOS (Mantiene el canal de comunicación vivo con Roblox)
// --------------------------------------------------------------------------
app.post('/webhook-erlc', (req, res) => {
    try {
        const signature = req.headers['x-erlc-signature'] || req.headers['X-ERLC-Signature'];
        const payload = req.body;

        if (signature && signature.includes('invalid')) {
            return res.status(400).send('Invalid Signature');
        }

        if (payload && payload.events) {
            for (const item of payload.events) {
                if (item.event === 'WebhookProbe') {
                    console.log("✅ Validación de Probe Exitosa.");
                    return res.status(200).send('OK');
                }
            }
        }
        return res.status(200).send('OK');
    } catch (error) {
        return res.status(200).send('OK');
    }
});

// --------------------------------------------------------------------------
// 📡 EXTRACTOR DE 911 (Estructura oficial V2 de tu documento)
// --------------------------------------------------------------------------
async function consultarEmergencias() {
    if (!ERLC_API_KEY || !DISCORD_WEBHOOK_URL) return; 

    try {
        // 💎 LA SOLUCIÓN REY: URL con el parámetro exacto (=true) y cabecera 'server-key'
        const respuesta = await axios.get('https://api.erlc.gg/v2/server?EmergencyCalls=true', {
            headers: { 
                'server-key': ERLC_API_KEY.trim() 
            }
        });

        // La API v2 devuelve el objeto global del servidor
        const datosServidor = respuesta.data;
        
        // Extraemos la lista específica de llamadas de emergencia (EmergencyCalls)
        const llamadas = datosServidor.EmergencyCalls;

        if (Array.isArray(llamadas) && llamadas.length > 0) {
            for (const llamada of llamadas) {
                // Generamos una ID única combinando el número de llamada y el momento de inicio
                const llamadaId = `${llamada.CallNumber}-${llamada.StartedAt}`;

                if (!llamadasProcesadas.has(llamadaId)) {
                    llamadasProcesadas.add(llamadaId);

                    // Mapeamos los datos según los atributos de tu documento:
                    const idLlamador = llamada.Caller || "Desconocido";
                    const quePaso = llamada.Description || "Sin descripción";
                    const ubicacion = llamada.PositionDescriptor || "Ubicación desconocida";
                    const equipo = llamada.Team || "Emergencia";

                    const embedDiscord = {
                        embeds: [{
                            title: `🚨 CENTRAL 911 [${equipo.toUpperCase()}] - CDMXRP 🚨`,
                            color: 16776960, // Amarillo táctico
                            fields: [
                                { name: "👤 ID del Reportante", value: `\`\`\`text\nID: ${idLlamador}\n\`\`\`` },
                                { name: "💬 Reporte / ¿Qué pasó?", value: `\`\`\`text\n${quePaso}\n\`\`\`` },
                                { name: "📍 Ubicación o Calle", value: `\`\`\`text\n${ubicacion}\n\`\`\`` }
                            ],
                            footer: { text: "Espacio CDMXRP" },
                            timestamp: new Date().toISOString()
                        }]
                    };

                    await axios.post(DISCORD_WEBHOOK_URL, embedDiscord);
                    console.log(`✅ Alerta N° ${llamada.CallNumber} enviada a Discord con éxito.`);
                }
            }
        }
    } catch (error) {
        if (error.response) {
            console.error(`❌ Error API ERLC: Código [${error.response.status}]`);
        } else {
            console.error("❌ Error de comunicación:", error.message);
        }
    }
}

// Revisa el servidor cada 5 segundos
setInterval(consultarEmergencias, 5000);

app.listen(PORT, () => {
    console.log(`🚀 Sistema V2 adaptado al manual corriendo en puerto ${PORT}`);
});
