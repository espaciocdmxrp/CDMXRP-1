const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Tu Webhook de Discord
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1510345288198525039/4b02Gby-X__5FSbYhWsDVA0E7jiliA7JV41t3hYS9WE0QpgCQuCCiupfpaS6IZqjVZwn";
const PORT = process.env.PORT || 3000;

app.post('/webhook-erlc', async (req, res) => {
    try {
        // 🛡️ REGLA DE VALIDACIÓN DE ERLC
        // Si Roblox manda una petición de prueba para validar el webhook,
        // el formato de los datos suele venir vacío o con firmas de prueba.
        // Si no detectamos datos válidos de juego, le devolvemos un 400 (Bad Request) como exige el error.
        if (!req.body || Object.keys(req.body).length === 0) {
            console.log("⚠️ Prueba de validación de ERLC detectada. Respondiendo 400.");
            return res.status(400).send('Invalid Probe');
        }

        const data = req.body;

        // Si ERLC manda un comando, lo ignoramos (solo queremos 911)
        if (data.Command) {
            return res.status(200).send('OK');
        }

        // Si es una llamada al 911 real, procesamos y enviamos a Discord
        if (data.Message) {
            const embedDiscord = {
                embeds: [{
                    title: "🚨 NUEVA LLAMADA AL 911 - CDMXRP 🚨",
                    description: `**👤 Reporta:** \`${data.Player || "Anónimo"}\`\n\n**💬 Mensaje de Emergencia:**\n"${data.Message}"`,
                    color: 16776960, 
                    footer: { text: "911 - Espacio CDMXRP" },
                    timestamp: new Date().toISOString()
                }]
            };

            await axios.post(DISCORD_WEBHOOK_URL, embedDiscord);
            console.log(`✅ Alerta de ${data.Player} enviada a Discord.`);
        }

        // Si todo sale bien, respondemos 200 a las peticiones reales
        res.status(200).send('OK');

    } catch (error) {
        console.error("❌ Error:", error.message);
        // Si hay una falla interna procesando datos corruptos, devolvemos 400 para cumplir el protocolo de Roblox
        res.status(400).send('Bad Request');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor de Emergencias listo en puerto ${PORT}`);
});
