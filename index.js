const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Tu Webhook de Discord
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1510345288198525039/4b02Gby-X__5FSbYhWsDVA0E7jiliA7JV41t3hYS9WE0QpgCQuCCiupfpaS6IZqjVZwn";
const PORT = process.env.PORT || 3000;

app.post('/webhook-erlc', async (req, res) => {
    try {
        // 🛡️ Filtro de validación para el "probe" de Roblox
        if (!req.body || Object.keys(req.body).length === 0) {
            console.log("⚠️ Validación de ERLC detectada.");
            return res.status(400).send('Invalid Probe');
        }

        const data = req.body;
        console.log("📥 Datos crudos de ERLC:", JSON.stringify(data));

        // Filtro rápido: Ignoramos los comandos administrativos
        if (data.Command) {
            return res.status(200).send('OK');
        }

        // Si contiene un mensaje (Llamadas al 911 / Mod Calls / Alertas)
        if (data.Message) {
            
            // Extraemos las variables que nos manda ERLC de forma nativa
            const usuario = data.Player || "Sistema / Anónimo";
            const quePaso = data.Message || "No se especificaron detalles.";
            const ubicacion = data.Location || "Ubicación Desconocida";

            // Diseño del Embed con los campos solicitados
            const embedDiscord = {
                embeds: [{
                    title: "🚨 CENTRAL DE EMERGENCIAS 911 - CDMXRP 🚨",
                    color: 16776960, // Amarillo de alerta (Decimal)
                    fields: [
                        {
                            name: "👤 ¿Quién llamó?",
                            value: `\`\`\`text\n${usuario}\n\`\`\``,
                            inline: false
                        },
                        {
                            name: "💬 ¿Qué pasó?",
                            value: `\`\`\`text\n${quePaso}\n\`\`\``,
                            inline: false
                        },
                        {
                            name: "📍 Ubicación del Reporte",
                            value: `\`\`\`text\n${ubicacion}\n\`\`\``,
                            inline: false
                        }
                    ],
                    footer: { 
                        text: "Sistema de Monitoreo ERLC Pack V2" 
                    },
                    timestamp: new Date().toISOString()
                }]
            };

            await axios.post(DISCORD_WEBHOOK_URL, embedDiscord);
            console.log(`✅ Embed de 911 enviado a Discord para el usuario: ${usuario}`);
        }

        res.status(200).send('OK');

    } catch (error) {
        console.error("❌ Error interno:", error.message);
        res.status(200).send('OK');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor activo y estructurado en puerto ${PORT}`);
});
