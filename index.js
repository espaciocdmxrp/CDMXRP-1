const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.raw({ type: 'application/json' }));

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1510345288198525039/4b02Gby-X__5FSbYhWsDVA0E7jiliA7JV41t3hYS9WE0QpgCQuCCiupfpaS6IZqjVZwn";
const PORT = process.env.PORT || 3000;

app.post('/webhook-erlc', async (req, res) => {
    try {
        const signature = req.headers['x-erlc-signature'] || req.headers['X-ERLC-Signature'];
        if (signature && signature.includes('invalid')) {
            return res.status(400).send('Invalid Signature Probe');
        }

        const bodyString = req.body.toString('utf-8');
        if (!bodyString || bodyString.trim() === '') {
            return res.status(400).send('Empty Body');
        }

        const data = JSON.parse(bodyString);
        console.log("📥 Paquete en Render:", bodyString);

        // CONFIGURACIÓN DE INSPECCIÓN: Dejamos pasar TODO a Discord para ver cómo viene estructurado
        const usuario = data.Player || data.User || "No detectado";
        const mensaje = data.Message || data.Text || "Sin texto directo";
        const ubicacion = data.Location || "No detectada";

        const embedDiscord = {
            embeds: [{
                title: "🔍 INSPECCIÓN DE ENTRADA ERLC 🔍",
                color: 3447003, // Azul para diferenciarlo de las alertas finales
                fields: [
                    { name: "👤 Jugador / Variable 'Player'", value: `\`\`\`text\n${usuario}\n\`\`\`` },
                    { name: "💬 Mensaje / Variable 'Message'", value: `\`\`\`text\n${mensaje}\n\`\`\`` },
                    { name: "📍 Ubicación / Variable 'Location'", value: `\`\`\`text\n${ubicacion}\n\`\`\`` },
                    { name: "📦 DATOS COMPLETOS ENVIADOS POR EL JUEGO:", value: `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`` }
                ],
                footer: { text: "Modo Diagnóstico CDMXRP" },
                timestamp: new Date().toISOString()
            }]
        };

        await axios.post(DISCORD_WEBHOOK_URL, embedDiscord);
        res.status(200).send('OK');

    } catch (error) {
        console.error("❌ Error:", error.message);
        res.status(200).send('OK');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor de inspección activo en puerto ${PORT}`);
});
