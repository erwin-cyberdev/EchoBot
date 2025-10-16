import ytdl from 'ytdl-core';
import yts from 'yt-search';
import fs from 'fs';
import path from 'path';

export default async function(sock, msg, args) {
  const from = msg.key.remoteJid;
  const query = args.join(' ');
  if (!query) return sock.sendMessage(from, { text: '❗ Usage: .yt <lien ou recherche>' });

  try {
    let url = query;

    // Recherche si ce n'est pas un lien direct
    if (!ytdl.validateURL(query)) {
      const r = await yts(query);
      if (!r || !r.videos || !r.videos.length)
        return sock.sendMessage(from, { text: '❗ Aucune vidéo trouvée.' });
      url = r.videos[0].url;
    }

    await sock.sendMessage(from, { text: `⏳ Téléchargement en cours...\n▶️ ${url}` });

    // Téléchargement
    const tempDir = path.join('./temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const tempPath = path.join(tempDir, `yt_${Date.now()}.mp4`);
    const stream = ytdl(url, { quality: 'highestvideo' });
    const file = fs.createWriteStream(tempPath);

    stream.pipe(file);

    file.on('finish', async () => {
      await sock.sendMessage(from, {
        video: { url: tempPath },
        caption: `🎬 Vidéo YouTube`,
      });
      fs.unlinkSync(tempPath);
    });

    file.on('error', async (err) => {
      console.error(err);
      await sock.sendMessage(from, { text: '❗ Erreur lors du téléchargement.' });
    });

  } catch (e) {
    console.error(e);
    await sock.sendMessage(from, { text: '❗ Erreur YouTube.' });
  }
}
