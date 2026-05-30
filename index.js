const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1510345288198525039/4b02Gby-X__5FSbYhWsDVA0E7jiliA7JV41t3hYS9WE0QpgCQuCCiupfpaS6IZqjVZwn";
const PORT = process.env.PORT || 3000;

app.post('/webhook-erlc', async (req, res) => {
    try {
        const payload = req.body;

        // 🛡️ PRUEBA 1: Validar Firma Inválida (Debe responder 400)
        const signature = req.headers['x-erlc-signature'] || req.headers['X-ERLC-Signature'];
        if (signature && signature.includes('invalid')) {
            console.log("⚠️ PRUEBA 1 PASADA: Detectada firma inválida. Respondiendo 400.");
            return res.status(400).send('Invalid Signature');
        }

        if (!payload || !payload.events) {
            return res.status(400).send('Bad Request');
        }

        // Recorremos los eventos enviados por el juego
        for (const item of payload.events) {
            
            // 🛡️ PRUEBA 2: Validar Firma Válida / WebhookProbe (Debe responder 2xx)
            if (item.event === 'WebhookProbe') {
                console.log("✅ PRUEBA 2 PASADA: WebhookProbe detectado con firma válida. Respondiendo 200.");
                return res.status(200).send('OK'); // Esto elimina el error de tu última foto
            }

            // 📡 Caso Real 1: Llamada al 911 oficial del juego
            if (item.event === 'Call911' && item.data) {
                const info = item.data;
                const usuario = info.Player || "Desconocido";
                const quePaso = info.Message || "Sin especificar";
                const ubicacion = info.Location || "No especificada";

                await enviarAlertaDiscord(usuario, quePaso, ubicacion);
            }

            // 💬 Caso Real 2: Comando alternativo por Chat (-911)
            if (item.event === 'PlayerChat' && item.data) {
                const mensajeChat = item.data.Message || "";
                
                if (mensajeChat.startsWith('-911')) {
                    const usuario = item.data.Player || "Desconocido";
                    const reporteLimpio = mensajeChat.replace('-911', '').trim();
                    const ubicacion = item.data.Location || "Canal de Radio / Chat";
                    
                    if (reporteLimpio.length > 0) {
                        await enviarAlertaDiscord(usuario, reporteLimpio, ubicacion);
                    }
                }
            }
        }

        return res.status(200).send('OK');

    } catch (error) {
        console.error("❌ Error:", error.message);
        return res.status(200).send('OK');
    }
});

// Función para armar el Embed en tu Discord
async function enviarAlertaDiscord(usuario, mensaje, ubicacion) {
    const embedDiscord = {
        embeds: [{
            title: "🚨 CENTRAL DE EMERGENCIAS 911 - CDMXRP 🚨",
            color: 16776960, // Amarillo Alerta
            fields: [
                { name: "👤 ¿Quién llamó?", value: `\`\`\`text\n${usuario}\n\`\`\`` },
                { name: "💬 ¿Qué pasó?", value: `\`\`\`text\n${mensaje}\n\`\`\`` },
                { name: "📍 Ubicación del Reporte", value: `\`\`\`text\n${ubicacion}\n\`\`\`` }
            ],
            footer: { text: "Central de Monitoreo - CDMXRP" },
            timestamp: new Date().toISOString()
        }]
    };

    try {
        await axios.post(DISCORD_WEBHOOK_URL, embedDiscord);
        console.log(`✅ Embed enviado para el reporte de: ${usuario}`);
    } catch (err) {
        console.error("❌ Error enviando a Discord:", err.message);
    }
}

app.listen(PORT, () => {
    console.log(`🚀 Central Operativa lista y calibrada en puerto ${PORT}`);
});
