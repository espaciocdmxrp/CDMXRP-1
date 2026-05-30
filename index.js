const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// 🔒 VARIABLES OCULTAS Y BLINDADAS
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK;
const ERLC_API_KEY = process.env.ERLC_KEY; 
const PORT = process.env.PORT || 3000;

// Registro para no duplicar las alertas en Discord
let llamadasProcesadas = new Set();

// --------------------------------------------------------------------------
// 🛡️ WEBHOOK DE EVENTOS (Vínculo vivo con el panel de Roblox)
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
// 📡 RELOJ CONSULTOR (Ruta combinada según especificaciones del anuncio)
// --------------------------------------------------------------------------
async function consultarEmergencias() {
    if (!ERLC_API_KEY || !DISCORD_WEBHOOK_URL) return; 

    try {
        // RUTA COMBINADA: Mantenemos la cola base pero inyectamos el query parameter del 911
        const respuesta = await axios.get('https://api.erlc.gg/v2/server/queue?EmergencyCalls', {
            headers: { 'X-Server-API-Key': ERLC_API_KEY }
        });

        const llamadas = respuesta.data;

        if (Array.isArray(llamadas) && llamadas.length > 0) {
            for (const llamada of llamadas) {
                const llamadaId = `${llamada.Timestamp}-${llamada.Player}`;

                if (!llamadasProcesadas.has(llamadaId)) {
                    llamadasProcesadas.add(llamadaId);

                    const embedDiscord = {
                        embeds: [{
                            title: "🚨 CENTRAL DE EMERGENCIAS 911 - CDMXRP 🚨",
                            color: 16776960, 
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
        console.error("❌ Error de comunicación con la API de ERLC:", error.message);
    }
}

// Revisa la API cada 5 segundos
setInterval(consultarEmergencias, 5000);

app.listen(PORT, () => {
    console.log(`🚀 Central Operativa Blindada activa en puerto ${PORT}`);
});
