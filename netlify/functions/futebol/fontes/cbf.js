// Scraper Fallback: CBF

import * as cheerio from 'cheerio';

export async function buscarJogosCBF() {
  const jogos = [];
  try {
    const fetchOptions = {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    };

    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const ano = now.getFullYear();
    const dataDeHoje = `${dia}/${mes}/${ano}`;

    const campeonatos = [
      {
        nome: 'Brasileirão Série A',
        url: `https://www.cbf.com.br/futebol-brasileiro/tabelas/campeonato-brasileiro/serie-a/${ano}`,
      },
      {
        nome: 'Brasileirão Série B',
        url: `https://www.cbf.com.br/futebol-brasileiro/tabelas/campeonato-brasileiro/serie-b/${ano}`,
      },
    ];

    for (const camp of campeonatos) {
      try {
        const response = await fetch(camp.url, fetchOptions);
        if (!response.ok) continue;

        const html = await response.text();
        const $ = cheerio.load(html);

        $('[class*="gameCardContainer"]').each((i, el) => {
          const infos = $(el).find('[class*="informations"] p').text().trim();
          const dateMatch = infos.match(/(\d{2}\/\d{2}\/\d{4})/);
          const dataJogo = dateMatch ? dateMatch[1] : '';

          if (dataJogo !== dataDeHoje) return;

          const mandante =
            $(el).find('[class*="score"] a strong').first().attr('title') ||
            $(el).find('[class*="score"] a strong').first().text().trim();
          const visitante =
            $(el).find('[class*="score"] a strong').last().attr('title') ||
            $(el).find('[class*="score"] a strong').last().text().trim();

          if (!mandante || !visitante) return;

          const placarMandanteStr = $(el).find('[class*="score"] > div').first().find('[class*="gol"]').text().trim();
          const placarVisitanteStr = $(el).find('[class*="score"] > div').last().find('[class*="gol"]').text().trim();

          const placarMandante = placarMandanteStr !== '' ? parseInt(placarMandanteStr, 10) : null;
          const placarVisitante = placarVisitanteStr !== '' ? parseInt(placarVisitanteStr, 10) : null;

          const timeMatch = infos.match(/(\d{2}:\d{2})/);
          const horario = timeMatch ? timeMatch[1] : '00:00';

          jogos.push({
            id: `cbf-${camp.nome}-${i}`,
            campeonato: camp.nome,
            campeonatoOriginal: camp.nome,
            rodada: '',
            horario: horario,
            status: placarMandante !== null && !isNaN(placarMandante) ? 'FT' : 'NS',
            minuto: null,
            mandante: { nome: mandante, escudo: null },
            visitante: { nome: visitante, escudo: null },
            placar: {
              mandante: isNaN(placarMandante) ? null : placarMandante,
              visitante: isNaN(placarVisitante) ? null : placarVisitante,
            },
            fonte: 'cbf',
            link: camp.url,
          });
        });
      } catch (err) {
        console.error(`Erro ao processar ${camp.nome}:`, err.message);
      }
    }
  } catch (error) {
    console.error('Erro Fonte CBF:', error.message);
  }
  return jogos;
}
