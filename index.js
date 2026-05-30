const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// 🔒 VARIABLES OCULTAS Y BLINDADAS (Nadie las puede ver en GitHub)
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK;
const ERLC_API_KEY = process.env.ERLC_KEY; 
const PORT = process.env.PORT || 3000;

// Guardamos las IDs de las llamadas procesadas para no repetir mensajes en Discord
let llamadasProcesadas = new Set();

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
                
                if (item.event === 'CommandExecuted') {
                    console.log(`💻 Comando ejecutado: ${item.data.Command}`);
                }
            }
        }
        return res.status(200).send('OK');
    } catch (error) {
        return res.status(200).send('OK');
    }
});

async function consultarEmergencias() {
    if (!ERLC_API_KEY || !DISCORD_WEBHOOK_URL) return; 

    try {
        const respuesta = await axios.get('https://api.erlc.gg/v2/server/queue?EmergencyCalls', {
            headers: { 'X-Server-API-Key': ERLC_API_KEY }
        });

        const llamadas = respuesta.data;

        if (Array.isArray(llamadas)) {
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
                    console.log(`✅ Alerta de emergencia de ${llamada.Player} enviada.`);
                }
            }
        }
    } catch (error) {
        console.error("❌ Error consultando la API de ERLC:", error.message);
    }
}

setInterval(consultarEmergencias, 5000);

app.listen(PORT, () => {
    console.log(`🚀 Sistema blindado corriendo en puerto ${PORT}`);
});
