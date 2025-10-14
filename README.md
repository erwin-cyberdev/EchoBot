// commands/extract.js
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const log = require('../logger')(module);

module.exports = {
    name: 'extract',
    description: 'Extrait et sauvegarde un média (image, vidéo ou voix), y compris view once.',
    adminOnly: false,
    run: async ({ sock, msg, replyWithTag }) => {
        let tempPath;
        try {
            // --- Crée dossier temporaire ---
            const tempDir = path.join(__dirname, "../temp");
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const remoteJid = msg.key.remoteJid; // groupe / privé
            const reactorJid = msg.key.participant || remoteJid; // auteur

            let quoted;

            // --- Cas 1 : si on a répondu à un message ---
            if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            }
            // --- Cas 2 : si la commande est envoyée juste après un média ---
            else {
                const chat = sock.chats.get(remoteJid);
                if (chat) {
                    const keys = Array.from(chat.messages.keys());
                    const lastKey = keys[keys.length - 2]; // message juste avant la commande
                    if (lastKey) {
                        quoted = chat.messages.get(lastKey)?.message;
                    }
                }
            }

            // --- Support view once (v1 + v2) ---
            const mediaMsg = quoted?.viewOnceMessage?.message ||
                             quoted?.viewOnceMessageV2?.message ||
                             quoted;

            if (!mediaMsg) {
                return replyWithTag(sock, remoteJid, msg, "❌ Aucun média détecté.");
            }

            // --- Détecter type ---
            const msgContent =
                mediaMsg.imageMessage ||
                mediaMsg.videoMessage ||
                mediaMsg.audioMessage;

            if (!msgContent) {
                return replyWithTag(sock, remoteJid, msg, "❌ Veuillez réagir à une image, vidéo ou note vocale (view once inclus).");
            }

            const mediaType = mediaMsg.imageMessage ? 'image' :
                              mediaMsg.videoMessage ? 'video' : 'audio';

            const ext = mediaType === 'image' ? 'jpg' :
                        mediaType === 'video' ? 'mp4' : 'ogg';
            tempPath = path.join(tempDir, `media_${Date.now()}.${ext}`);

            await replyWithTag(sock, remoteJid, msg, '⏳ Téléchargement en cours...');

            // --- Télécharger ---
            let buffer = Buffer.from([]);
            const stream = await downloadContentFromMessage(msgContent, mediaType);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            fs.writeFileSync(tempPath, buffer);
            log(`[EXTRACT] Média téléchargé: ${tempPath} (${buffer.length} bytes)`);

            // --- Objet d’envoi ---
            let sendObj;
            if (mediaType === 'image') sendObj = { image: { url: tempPath }, caption: "📸 Média extrait" };
            else if (mediaType === 'video') sendObj = { video: { url: tempPath }, caption: "🎬 Média extrait" };
            else sendObj = { audio: { url: tempPath }, mimetype: 'audio/ogg' };

            // --- Envoi au réacteur ---
            await sock.sendMessage(reactorJid, sendObj);
            log(`[EXTRACT] Média envoyé à ${reactorJid} ✅`);

            // --- Envoi aussi dans le groupe / chat d’origine ---
            if (remoteJid !== reactorJid) {
                await sock.sendMessage(remoteJid, sendObj);
                log(`[EXTRACT] Média aussi envoyé dans ${remoteJid} ✅`);
            }

        } catch (err) {
            console.error('[EXTRACT] Erreur:', err);
            await replyWithTag(sock, msg.key.remoteJid, msg, "❌ Impossible de récupérer le média.");
        } finally {
            if (tempPath && fs.existsSync(tempPath)) {
                try {
                    fs.unlinkSync(tempPath);
                    log('[EXTRACT] Nettoyage terminé.');
                } catch {}
            }
        }
    }
};
