import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  const method = event.httpMethod;
  const token = event.headers['x-sync-token'];

  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Senha Mestra obrigatória' }) };
  }

  if (!process.env.DATABASE_URL) {
    return { statusCode: 500, body: JSON.stringify({ error: 'DATABASE_URL não configurada' }) };
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    // GET: retorna todos os favicons como { domain: favicon_url }
    if (method === 'GET') {
      const rows = await sql`SELECT domain, favicon_url FROM solhub_favicons`;
      const favicons = {};
      rows.forEach((row) => {
        favicons[row.domain] = row.favicon_url;
      });
      return { statusCode: 200, body: JSON.stringify({ favicons }) };
    }

    // POST: upsert de um favicon { domain, favicon_url }
    if (method === 'POST') {
      const { domain, favicon_url } = JSON.parse(event.body);
      if (!domain || !favicon_url) {
        return { statusCode: 400, body: JSON.stringify({ error: 'domain e favicon_url obrigatórios' }) };
      }
      await sql`
        INSERT INTO solhub_favicons (domain, favicon_url, updated_at)
        VALUES (${domain}, ${favicon_url}, NOW())
        ON CONFLICT (domain)
        DO UPDATE SET favicon_url = EXCLUDED.favicon_url, updated_at = NOW()
      `;
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // DELETE: remove por domain (via query string ?domain=github.com)
    if (method === 'DELETE') {
      const domain = event.queryStringParameters?.domain;
      if (!domain) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Parâmetro domain obrigatório' }) };
      }
      await sql`DELETE FROM solhub_favicons WHERE domain = ${domain}`;
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, body: 'Método não permitido' };
  } catch (error) {
    console.error('Erro na função favicon:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
