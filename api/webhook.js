import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'POST') {
      const { type, visitorName, projectName } = req.body;
      
      // Webhook URL - kullanıcı tarafından .env dosyasında tanımlanır
      const webhookUrl = process.env.WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL || process.env.TELEGRAM_WEBHOOK_URL;
      
      let message = '';
      let embedData = null;
      
      if (type === 'visitor_login') {
        message = `🟢 YÖRÜKHAN Sinyali: **${visitorName}** şu anda siteye giriş yaptı!`;
        embedData = {
          title: '🟢 Yeni Ziyaretçi Girişi',
          description: `**${visitorName}** YÖRÜKHAN Laboratuvarına giriş yaptı.`,
          color: 0x00ff88,
          timestamp: new Date().toISOString(),
          footer: { text: 'YÖRÜKHAN Telemetri Sistemi' }
        };
      } else if (type === 'project_click') {
        message = `🎯 Aksiyon: **${visitorName}**, **${projectName}** projesini incelemeye başladı.`;
        embedData = {
          title: '🎯 Proje İncelemesi',
          description: `**${visitorName}**, **${projectName}** projesini incelemeye başladı.`,
          color: 0x5865f2,
          timestamp: new Date().toISOString(),
          footer: { text: 'YÖRÜKHAN Telemetri Sistemi' }
        };
      }

      // Send webhook notification if URL is configured
      if (webhookUrl) {
        try {
          // Discord format
          if (webhookUrl.includes('discord.com')) {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                embeds: [embedData]
              })
            });
          } 
          // Telegram format
          else if (webhookUrl.includes('telegram') || webhookUrl.includes('api.telegram.org')) {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: message,
                parse_mode: 'Markdown'
              })
            });
          }
          // Generic webhook
          else {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type,
                visitorName,
                projectName,
                timestamp: new Date().toISOString(),
                embed: embedData
              })
            });
          }
        } catch (webhookError) {
          console.error('Webhook gönderilemedi:', webhookError.message);
          // Continue even if webhook fails
        }
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Webhook işlendi',
        webhookSent: !!webhookUrl 
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Webhook API error:', err);
    res.status(500).json({ error: err.message });
  }
}
