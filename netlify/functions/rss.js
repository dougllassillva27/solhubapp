export const handler = async (event) => {
  const { url } = event.queryStringParameters;

  if (!url) {
    return { statusCode: 400, body: JSON.stringify({ error: 'URL obrigatória' }) };
  }

  try {
    const response = await fetch(url);
    const xml = await response.text();

    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < 10) {
      const content = match[1];

      const getTag = (tag) => {
        const regex = new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`);
        return content.match(regex)?.[1]?.trim() || '';
      };

      items.push({
        title: getTag('title'),
        link: getTag('link'),
        pubDate: getTag('pubDate'),
        author: 'TabNews',
      });
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
