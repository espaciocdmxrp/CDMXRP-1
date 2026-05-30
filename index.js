const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1510345288198525039/4b02Gby-X__5FSbYhWsDVA0E7jiliA7JV41t3hYS9WE0QpgCQuCCiupfpaS6IZqjVZwn";
const PORT = process.env.PORT || 3000;

app.post('/webhook-erlc', async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            console.log("⚠️ Validación de ERLC detectada.");
            return res.status(400).send('Invalid Probe');
        }

        const data = req.body;
        
        // 🔍 ESTO NOS VA A MOSTRAR EL PAQUETE REAL EN LOS LOGS DE RENDER
        console.log("📥 DATOS RECIBIDOS DESDE ROBLOX:", JSON.stringify(data));

        // Si es un comando de Staff, lo ignoramos para mantener limpio el canal
        if (data.Command) {
            console.log(`💻 Comando ocultado: ${data.Command}`);
            return res.status(200).send('OK');
        }

        // Enviamos directo a Discord usando los datos disponibles o un genérico si cambiaron de nombre
        const usuario = data.Player || data.User || "Desconocido";
        const mensaje = data.Message || data.Text || "Llamada entrante sin texto detectable";
        const ubicacion = data.Location || data.Place || "No especificada";

        const embedDiscord = {
            embeds: [{
                title: "🚨 CENTRAL DE EMERGENCIAS 911 - CDMXRP 🚨",
                color: 16776960,
                fields: [
                    { name: "👤 Usuario / Reporta", value: `\`\`\`text\n${usuario}\n\`\`\`` },
                    { name: "💬 Mensaje / Emergencia", value: `\`\`\`text\n${mensaje}\n\`\`\`` },
                    { name: "📍 Ubicación", value: `\`\`\`text\n${ubicacion}\n\`\`\`` }
                ],
                footer: { text: "Sistema de Emergencias CDMXRP" },
                timestamp: new Date().toISOString()
            }]
        };

        await axios.post(DISCORD_WEBHOOK_URL, embedDiscord);
        console.log("✅ Intento de envío a Discord completado.");

        res.status(200).send('OK');

    } catch (error) {
        console.error("❌ Error en el proceso:", error.message);
        res.status(200).send('OK');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor de diagnóstico corriendo en puerto ${PORT}`);
});
