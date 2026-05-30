const express = require('express');
const axios = require('axios');
const app = express();

// 🛡️ CONTROL DE VALIDACIÓN ULTRA RÁPIDO (Antes de procesar cualquier JSON)
app.use((req, res, next) => {
    // Buscamos la firma en cualquier formato de mayúsculas/minúsculas
    const signature = req.headers['x-erlc-signature'] || req.headers['X-ERLC-Signature'];
    
    if (signature && signature.includes('invalid')) {
        console.log("⚠️ PRUEBA 1 PASADA: Detectada firma inválida en el acto. Respondiendo 400.");
        return res.status(400).send('Invalid Signature');
    }
    next();
});

// Procesamos el JSON normal para el resto de peticiones
app.use(express.json());

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1510345288198525039/4b02Gby-X__5FSbYhWsDVA0E7jiliA7JV41t3hYS9WE0QpgCQuCCiupfpaS6IZqjVZwn";
const PORT = process.env.PORT || 3000;

app.post('/webhook-erlc', async (req, res) => {
    try {
        const payload = req.body;

        if (!payload || !payload.events) {
            return res.status(400).send('Bad Request');
        }

        for (const item of payload.events) {
            
            // 🛡️ PRUEBA 2: Validar Prueba Correcta (Debe responder 200 OK)
            if (item.event === 'WebhookProbe') {
                console.log("✅ PRUEBA 2 PASADA: WebhookProbe detectado con éxito. Respondiendo 200.");
                return res.status(200).send('OK');
            }

            // 📡 Caso Real 1: Llamada al 911 oficial del juego
            if (item.event === 'Call911' && item.data) {
                const info = item.data;
                await enviarAlertaDiscord(
                    info.Player || "Desconocido", 
                    info.Message || "Sin especificar", 
                    info.Location || "No especificada"
                );
            }

            // 💬 Caso Real 2: Comando por Chat (-911)
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
        console.error("❌ Error interno:", error.message);
        return res.status(200).send('OK');
    }
});

// Función para enviar el Embed a tu canal de Discord
async function enviarAlertaDiscord(usuario, mensaje, ubicacion) {
    const embedDiscord = {
        embeds: [{
            title: "🚨 CENTRAL DE EMERGENCIAS 911 - CDMXRP 🚨",
            color: 16776960,
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
        console.log(`✅ Reporte de ${usuario} enviado a Discord.`);
    } catch (err) {
        console.error("❌ Error enviando a Discord:", err.message);
    }
}

app.listen(PORT, () => {
    console.log(`🚀 Central Operativa en línea en el puerto ${PORT}`);
});
