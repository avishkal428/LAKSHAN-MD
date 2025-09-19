const formatAudio = ['mp3'];

const ddownr = {
  download: async (url, format) => {
    if (!formatAudio.includes(format)) {
      throw new Error('Format audio tidak didukung.');
    }

    const config = {
      method: 'GET',
      url: `https://p.oceansaver.in/ajax/download.php?format=${format}&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    };

    try {
      const { data } = await axios.request(config);
      if (data && data.success) {
        const { id, title, info } = data;
        const downloadUrl = await ddownr.cekProgress(id);
        return {
          id,
          title,
          image: info.image,
          downloadUrl
        };
      } else {
        throw new Error('Gagal mengambil detail video.');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  cekProgress: async (id) => {
    const config = {
      method: 'GET',
      url: `https://p.oceansaver.in/ajax/progress.php?id=${id}`,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    };

    try {
      let attempt = 0;
      const maxAttempt = 20;

      while (attempt < maxAttempt) {
        const { data } = await axios.request(config);
        if (data && data.success && data.progress === 1000) {
          return data.download_url;
        }
        attempt++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      throw new Error('Timeout saat menunggu progres download.');
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
};

