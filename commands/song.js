import yts from 'yt-search';
import ytdl from 'ytdl-core';
import fs from 'fs';
import path from 'path';

export default async function(sock, msg, args) {
  const from = msg.key.remoteJid;
  const query = args.join(' ');
  if (!query) return sock.sendMessage(from, { text: '❗ Usage: .song <titre>' });

  try {
    const r = await yts(query);
    if (!r || !r.videos.length)
      return sock.sendMessage(from, { text: '❗ Aucun résultat.' });

    const video = r.videos[0];
    await sock.sendMessage(from, { text: `⏳ Téléchargement audio en cours...\n🎧 ${video.title}\n${video.url}` });

    // Téléchargement audio
    const tempDir = path.join('./temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const tempPath = path.join(tempDir, `song_${Date.now()}.mp3`);
    const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' });
    const file = fs.createWriteStream(tempPath);

    stream.pipe(file);

    file.on('finish', async () => {
      await sock.sendMessage(from, {
        audio: { url: tempPath },
        mimetype: 'audio/mpeg',
        ptt: false, // si true → note vocale
      });
      fs.unlinkSync(tempPath);
    });

    file.on('error', async (err) => {
      console.error(err);
      await sock.sendMessage(from, { text: '❗ Erreur lors du téléchargement audio.' });
    });

  } catch (e) {
    console.error(e);
    await sock.sendMessage(from, { text: '❗ Erreur lors de la recherche de chanson.' });
  }
}
