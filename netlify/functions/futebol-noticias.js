export const handler = async (event) => {
  const rssUrl = event.queryStringParameters?.url || 'https://ge.globo.com/Esportes/Rss/0,,AS0-9825,00.xml';

  try {
    const response = await fetch(rssUrl);
    const xml = await response.text();

    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < 8) {
      const content = match[1];

      const getTag = (tag) => {
        const regex = new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`);
        return content.match(regex)?.[1]?.trim() || '';
      };

      // Tenta extrair imagem do media:content ou da description
      let imagem = null;
      const mediaMatch = content.match(/<media:content[^>]*url="([^"]+)"/);
      if (mediaMatch) {
        imagem = mediaMatch[1];
      } else {
        const desc = getTag('description');
        const imgMatch = desc.match(/src="([^"]+)"/);
        if (imgMatch) imagem = imgMatch[1];
      }

      items.push({
        id: getTag('guid') || getTag('link'),
        titulo: getTag('title'),
        link: getTag('link'),
        dataPublicacao: getTag('pubDate'),
        fonte: 'GE Futebol',
        imagem: imagem,
      });
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens: items }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
