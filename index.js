const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// 🔒 VARIABLES OCULTAS EN RENDER
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK;
const ERLC_API_KEY = process.env.ERLC_KEY; 
const PORT = process.env.PORT || 3000;

// Registro para no duplicar alertas en tu Discord
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
// 📡 EXTACTOR AUTOMÁTICO DE 911 (Usando el header oficial: 'server-key')
// --------------------------------------------------------------------------
async function consultarEmergencias() {
    if (!ERLC_API_KEY || !DISCORD_WEBHOOK_URL) return; 

    try {
        // Consultamos la cola del servidor con el parámetro oficial de llamadas
        const respuesta = await axios.get('https://api.erlc.gg/v2/server/queue?EmergencyCalls', {
            headers: { 
                // 💎 ARREGLO DE ORO: El header exacto que exige la documentación oficial V2
                'server-key': ERLC_API_KEY.trim() 
            }
        });

        const llamadas = respuesta.data;

        // Si la API nos devuelve llamadas, las procesamos una por una
        if (Array.isArray(llamadas) && llamadas.length > 0) {
            for (const llamada of llamadas) {
                // Generamos una ID única mezclando tiempo y jugador para evitar repeticiones
                const llamadaId = `${llamada.Timestamp}-${llamada.Player}`;

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
        if (error.response) {
            console.error(`❌ API ERLC rechazó la consulta. Estado: [${error.response.status}].`);
        } else {
            console.error("❌ Error de red:", error.message);
        }
    }
}

// Escanea los servidores de ERLC activamente cada 5 segundos
setInterval(consultarEmergencias, 5000);

app.listen(PORT, () => {
    console.log(`🚀 Central Operativa V2 activa y blindada en puerto ${PORT}`);
});
