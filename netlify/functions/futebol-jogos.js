export const handler = async (event) => {
  const apiKey = event.headers['x-api-key'];
  const ligasParam = event.queryStringParameters?.ligas;

  if (!apiKey) {
    return { statusCode: 401, body: JSON.stringify({ error: 'API Key ausente' }) };
  }

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // YYYY-MM-DD

  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${today}&timezone=America/Sao_Paulo`,
      {
        headers: {
          'x-apisports-key': apiKey,
        },
      }
    );

    const data = await response.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      return { statusCode: 400, body: JSON.stringify({ error: Object.values(data.errors)[0] }) };
    }

    let jogosFiltrados = data.response || [];

    if (ligasParam && ligasParam.trim() !== '') {
      const ligasDesejadas = ligasParam
        .toLowerCase()
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      jogosFiltrados = jogosFiltrados.filter((j) => {
        const nameLower = j.league.name.toLowerCase();
        const leagueId = String(j.league.id);
        return ligasDesejadas.some((liga) => {
          if (/^\d+$/.test(liga)) {
            return leagueId === liga;
          }
          return nameLower.includes(liga);
        });
      });
    } else {
      jogosFiltrados = jogosFiltrados.filter((j) => {
        return j.league.country === 'Brazil';
      });
    }

    const jogos = jogosFiltrados.map((j) => ({
      id: String(j.fixture.id),
      campeonato: j.league.name,
      rodada: j.league.round,
      horario: new Date(j.fixture.date).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      }),
      status: j.fixture.status.short, // NS, LIVE, HT, FT...
      minuto: j.fixture.status.elapsed,
      mandante: { nome: j.teams.home.name, escudo: j.teams.home.logo },
      visitante: { nome: j.teams.away.name, escudo: j.teams.away.logo },
      placar: { mandante: j.goals.home, visitante: j.goals.away },
    }));

    // Ordenação: Ao vivo (1) > Agendado (2) > Encerrado (3)
    const getPesoStatus = (status) => {
      if (['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(status)) return 1;
      if (['NS'].includes(status)) return 2;
      return 3;
    };

    jogos.sort((a, b) => {
      const pesoA = getPesoStatus(a.status);
      const pesoB = getPesoStatus(b.status);
      if (pesoA !== pesoB) return pesoA - pesoB;
      return a.horario.localeCompare(b.horario);
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataReferencia: today, jogos }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
