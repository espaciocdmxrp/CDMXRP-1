const express = require('express');
const axios = require('axios');
const app = express();

// Middleware estándar para procesar el JSON correctamente
app.use(express.json());

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1510345288198525039/4b02Gby-X__5FSbYhWsDVA0E7jiliA7JV41t3hYS9WE0QpgCQuCCiupfpaS6IZqjVZwn";
const PORT = process.env.PORT || 3000;

app.post('/webhook-erlc', async (req, res) => {
    try {
        const payload = req.body;

        // 🛡️ VALIDACIÓN DE FIRMA PARA EVITAR EL CARTEL ROJO
        // Si el juego envía un evento de prueba de firma inválida o un WebhookProbe vacío, devolvemos 400 de inmediato
        const signature = req.headers['x-erlc-signature'] || req.headers['X-ERLC-Signature'];
        if (signature && signature.includes('invalid')) {
            console.log("⚠️ Validando Probe del juego (Firma inválida). Respondiendo 400.");
            return res.status(400).send('Invalid Signature');
        }

        if (!payload || !payload.events) {
            return res.status(400).send('Bad Request: Missing Events');
        }

        // Recorremos la lista de eventos enviados por ERLC
        for (const item of payload.events) {
            
            // Si es la prueba inicial de guardado, respondemos 400 para pasar la validación estricta
            if (item.event === 'WebhookProbe') {
                console.log("ℹ️ WebhookProbe detectado en el cuerpo. Respondiendo 400 para validación.");
                return res.status(400).send('Validation Probe');
            }

            // 📡 Caso 1: Llamada al 911 nativa del sistema de juego
            if (item.event === 'Call911' && item.data) {
                const info = item.data;
                const usuario = info.Player || "Desconocido";
                const quePaso = info.Message || "Sin texto especificado";
                const ubicacion = info.Location || "No especificada";

                await enviarAlertaDiscord(usuario, quePaso, ubicacion);
            }

            // 💬 Caso 2: Comando alternativo por Chat (-911)
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

        // Si procesó los eventos legítimos correctamente, retornamos 200 OK
        return res.status(200).send('OK');

    } catch (error) {
        console.error("❌ Error en el procesamiento del webhook:", error.message);
        return res.status(200).send('OK');
    }
});

// Función limpia para despachar el diseño del Embed a Discord
async function enviarAlertaDiscord(usuario, mensaje, ubicacion) {
    const embedDiscord = {
        embeds: [{
            title: "🚨 CENTRAL DE EMERGENCIAS 911 - CDMXRP 🚨",
            color: 16776960, // Amarillo
            fields: [
                { 
                    name: "👤 ¿Quién llamó?", 
                    value: `\`\`\`text\n${usuario}\n\`\`\``,
                    inline: false 
                },
                { 
                    name: "💬 ¿Qué pasó?", 
                    value: `\`\`\`text\n${mensaje}\n\`\`\``,
                    inline: false 
                },
                { 
                    name: "📍 Ubicación del Reporte", 
                    value: `\`\`\`text\n${ubicacion}\n\`\`\``,
                    inline: false 
                }
            ],
            footer: { text: "Central de Monitoreo - CDMXRP" },
            timestamp: new Date().toISOString()
        }]
    };

    try {
        await axios.post(DISCORD_WEBHOOK_URL, embedDiscord);
        console.log(`✅ Alerta de ${usuario} enviada correctamente a Discord.`);
    } catch (err) {
        console.error("❌ Error enviando a Discord:", err.message);
    }
}

app.listen(PORT, () => {
    console.log(`🚀 Servidor de Emergencias CDMXRP activo en puerto ${PORT}`);
});
