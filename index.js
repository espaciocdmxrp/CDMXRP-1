const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.raw({ type: 'application/json' }));

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1510345288198525039/4b02Gby-X__5FSbYhWsDVA0E7jiliA7JV41t3hYS9WE0QpgCQuCCiupfpaS6IZqjVZwn";
const PORT = process.env.PORT || 3000;

app.post('/webhook-erlc', async (req, res) => {
    try {
        // 🛡️ Filtro de seguridad para que Roblox valide la URL con éxito
        const signature = req.headers['x-erlc-signature'] || req.headers['X-ERLC-Signature'];
        if (signature && signature.includes('invalid')) {
            return res.status(400).send('Invalid Signature Probe');
        }

        const bodyString = req.body.toString('utf-8');
        if (!bodyString || bodyString.trim() === '') {
            return res.status(400).send('Empty Body');
        }

        const payload = JSON.parse(bodyString);

        // Verificamos si el paquete contiene la lista de eventos nativa de ERLC
        if (payload.events && Array.isArray(payload.events)) {
            for (const item of payload.events) {
                
                // 1. Ignoramos los Probes de prueba repetidos para no saturar Discord
                if (item.event === 'WebhookProbe') {
                    console.log("ℹ️ Probe de validación ignorado correctamente.");
                    continue;
                }

                // 2. Filtramos ÚNICAMENTE cuando el evento sea una llamada al 911 legítima
                if (item.event === 'Call911' && item.data) {
                    const info = item.data;
                    
                    // Extraemos los parámetros exactos del API de ERLC
                    const usuario = info.Player || "Sistema / Anónimo";
                    const quePaso = info.Message || "Sin detalles especificados.";
                    const ubicacion = info.Location || "Ubicación Desconocida";

                    const embedDiscord = {
                        embeds: [{
                            title: "🚨 CENTRAL DE EMERGENCIAS 911 - CDMXRP 🚨",
                            color: 16776960, // Amarillo táctico
                            fields: [
                                { 
                                    name: "👤 ¿Quién llamó?", 
                                    value: `\`\`\`text\n${usuario}\n\`\`\`` 
                                },
                                { 
                                    name: "💬 ¿Qué pasó?", 
                                    value: `\`\`\`text\n${quePaso}\n\`\`\`` 
                                },
                                { 
                                    name: "📍 Ubicación del Reporte", 
                                    value: `\`\`\`text\n${ubicacion}\n\`\`\`` 
                                }
                            ],
                            footer: { text: "Sistema de Emergencias - CDMXRP" },
                            timestamp: new Date().toISOString()
                        }]
                    };

                    await axios.post(DISCORD_WEBHOOK_URL, embedDiscord);
                    console.log(`✅ 911 de ${usuario} enviado con éxito.`);
                }
            }
        }

        // Siempre respondemos 200 a Roblox para que sepa que procesamos todo bien
        res.status(200).send('OK');

    } catch (error) {
        console.error("❌ Error procesando el paquete:", error.message);
        res.status(200).send('OK');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Central de Emergencias CDMXRP operativa en puerto ${PORT}`);
});
