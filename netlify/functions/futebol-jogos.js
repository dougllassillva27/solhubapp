import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: [['dc:subject', 'subject']],
  },
});

const MAPA_LIGAS = {
  'Brasileirão Série A': ['Brasileirão Série A', 'Brasileiro Série A', 'Campeonato Brasileiro Série A'],
  'Brasileirão Série B': ['Brasileirão Série B', 'Brasileiro Série B', 'Campeonato Brasileiro Série B'],
  'Copa do Brasil': ['Copa do Brasil'],
  Libertadores: ['Copa Libertadores', 'Libertadores'],
  'Sul-Americana': ['Copa Sul-Americana', 'Sul-Americana'],
  'Copa do Mundo': ['World Cup', 'Copa do Mundo'],
  'Premier League': ['Premier League'],
  'La Liga': ['LaLiga', 'LaLiga EA Sports', 'Campeonato Espanhol'],
};

function normalizarLiga(ligaOriginal) {
  if (!ligaOriginal) return null;
  const ligaLower = ligaOriginal.toLowerCase();
  for (const [ligaPadrao, aliases] of Object.entries(MAPA_LIGAS)) {
    for (const alias of aliases) {
      if (ligaLower.includes(alias.toLowerCase())) {
        return ligaPadrao;
      }
    }
  }
  return null;
}

const fetchAndParse = async (url) => {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
  });

  if (!response.ok) {
    throw new Error(`Status ${response.status} ao acessar ${url}`);
  }

  const buffer = await response.arrayBuffer();
  let xml = new TextDecoder('utf-8').decode(buffer);
  if (xml.includes('encoding="ISO-8859-1"') || xml.includes('encoding="iso-8859-1"')) {
    xml = new TextDecoder('iso-8859-1').decode(buffer);
  }
  return parser.parseString(xml);
};

export const handler = async (event) => {
  const { urlProx, urlRes } = event.queryStringParameters || {};
  const rssProx = urlProx || 'https://www.ogol.com.br/rss/proxjogos.php';
  const rssRes = urlRes || 'https://www.ogol.com.br/rss/resultados.php';

  try {
    const [feedProx, feedRes] = await Promise.all([
      fetchAndParse(rssProx).catch((e) => {
        console.error('Erro ProxJogos:', e.message);
        return { items: [] };
      }),
      fetchAndParse(rssRes).catch((e) => {
        console.error('Erro Resultados:', e.message);
        return { items: [] };
      }),
    ]);

    const jogos = [];

    // Próximos Jogos (Agendados)
    feedProx.items.forEach((item, index) => {
      // Ex: [Brasileirão] Flamengo x Vasco OU Flamengo vs Vasco
      const match = item.title.match(/^(?:\[(.*?)\]\s*)?(.*?)\s+(?:x|v|vs|-)\s+(.*)$/i);
      if (match) {
        const ligaOriginal = item.subject || (match[1] ? match[1].trim() : null);
        const ligaNormalizada = normalizarLiga(ligaOriginal);

        if (!ligaNormalizada) return; // Descarta jogos fora do filtro

        let horarioFormatado = '';
        try {
          const d = new Date(item.pubDate || item.isoDate);
          if (!isNaN(d.getTime())) {
            horarioFormatado = d.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'America/Sao_Paulo',
            });
          }
        } catch (e) {}

        jogos.push({
          id: `prox-${index}`,
          campeonato: ligaNormalizada,
          rodada: '',
          horario: horarioFormatado || '00:00',
          status: 'NS',
          minuto: null,
          mandante: { nome: match[2] ? match[2].trim() : 'Desconhecido', escudo: null },
          visitante: { nome: match[3] ? match[3].trim() : 'Desconhecido', escudo: null },
          placar: { mandante: null, visitante: null },
        });
      }
    });

    // Resultados (Encerrados)
    feedRes.items.forEach((item, index) => {
      // Ex: [Brasileirão] Flamengo 2-1 Vasco OU Flamengo 2 x 1 Vasco
      const match = item.title.match(/^(?:\[(.*?)\]\s*)?(.*?)\s+(\d+)\s*(?:x|-)\s*(\d+)\s+(.*)$/i);
      if (match) {
        const ligaOriginal = item.subject || (match[1] ? match[1].trim() : null);
        const ligaNormalizada = normalizarLiga(ligaOriginal);

        if (!ligaNormalizada) return; // Descarta jogos fora do filtro

        jogos.push({
          id: `res-${index}`,
          campeonato: ligaNormalizada,
          rodada: '',
          horario: 'Encerrado',
          status: 'FT',
          minuto: null,
          mandante: { nome: match[2].trim(), escudo: null },
          visitante: { nome: match[5].trim(), escudo: null },
          placar: { mandante: parseInt(match[3], 10), visitante: parseInt(match[4], 10) },
        });
      }
    });

    jogos.sort((a, b) => {
      if (a.status === 'NS' && b.status === 'FT') return -1;
      if (a.status === 'FT' && b.status === 'NS') return 1;
      return 0;
    });

    // Limita para não estourar a interface
    const limitados = jogos.slice(0, 15);

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataReferencia: today, jogos: limitados }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
