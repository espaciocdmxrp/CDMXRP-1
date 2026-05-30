const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.raw({ type: 'application/json' }));

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1510345288198525039/4b02Gby-X__5FSbYhWsDVA0E7jiliA7JV41t3hYS9WE0QpgCQuCCiupfpaS6IZqjVZwn";
const PORT = process.env.PORT || 3000;

app.post('/webhook-erlc', async (req, res) => {
    try {
        const bodyString = req.body.toString('utf-8');
        const data = JSON.parse(bodyString);

        if (data.Message && !data.Command) {
            
            const embedDiscord = {
                embeds: [{
                    title: "🚨 NUEVA LLAMADA AL 911 - CDMXRP 🚨",
                    description: `**👤 Reporta:** \`${data.Player || "Anónimo"}\`\n\n**💬 Mensaje de Emergencia:**\n"${data.Message}"`,
                    color: 16776960, // Color Amarillo de Alerta (Decimal)
                    footer: { 
                        text: "Central de Emergencias - Espacio CDMXRP" 
                    },
                    timestamp: new Date().toISOString()
                }]
            };

            await axios.post(DISCORD_WEBHOOK_URL, embedDiscord);
            console.log(`🚨 Llamada de ${data.Player} enviada a Discord.`);
        } else {
            console.log("ℹ️ Evento ignorado (No es una llamada al 911).");
        }

        res.status(200).send('OK');

    } catch (error) {
        console.error("❌ Error procesando el evento:", error.message);
        res.status(400).send('Bad Request');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor de Emergencias 911 corriendo en puerto ${PORT}`);
});
