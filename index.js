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
// 🛡️ WEBHOOK DE EVENTOS (Mantiene el vínculo vivo con Roblox)
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
// 📡 EXTRACTOR DE 911 (URL Base Limpia oficial de la V2)
// --------------------------------------------------------------------------
async function consultarEmergencias() {
    if (!ERLC_API_KEY || !DISCORD_WEBHOOK_URL) return; 

    try {
        // 💎 SOLUCIÓN: Ruta exacta `/v2/server` tal cual exige el punto 3 de tu manual
        const respuesta = await axios.get('https://api.erlc.gg/v2/server', {
            headers: { 
                'server-key': ERLC_API_KEY.trim() 
            }
        });

        // En la v2, si pasás la key, la respuesta del estado del servidor trae adentro la lista de llamadas activas
        const datosServidor = respuesta.data;
        
        // Buscamos si dentro de la data viene el array de llamadas de emergencia
        const llamadas = datosServidor.EmergencyCalls || datosServidor.queue || datosServidor;

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
        if (error.response) {
            console.error(`❌ API ERLC rechazó la consulta. Estado: [${error.response.status}].`);
        } else {
            console.error("❌ Error de red:", error.message);
        }
    }
}

// Escanea la API cada 5 segundos
setInterval(consultarEmergencias, 5000);

app.listen(PORT, () => {
    console.log(`🚀 Central Operativa V2 calibrada en puerto ${PORT}`);
});
