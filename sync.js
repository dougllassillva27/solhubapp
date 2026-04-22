import { neon } from '@neondatabase/serverless';

export const handler = async (event, context) => {
  const method = event.httpMethod;
  const token = event.headers['x-sync-token'];

  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Senha Mestra obrigatória' }) };
  }

  if (!process.env.SYNC_PASSWORD) {
    return { statusCode: 500, body: JSON.stringify({ error: 'SYNC_PASSWORD não configurada no servidor' }) };
  }

  if (token !== process.env.SYNC_PASSWORD) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Senha Mestra incorreta' }) };
  }

  if (!process.env.DATABASE_URL) {
    return { statusCode: 500, body: JSON.stringify({ error: 'DATABASE_URL não configurada no servidor' }) };
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const universalKey = 'admin_sync';

    if (method === 'GET') {
      const result = await sql`SELECT data FROM solhub_sync WHERE token = ${universalKey}`;
      if (result.length === 0) {
        return { statusCode: 200, body: JSON.stringify({ data: null }) };
      }
      return { statusCode: 200, body: JSON.stringify({ data: result[0].data }) };
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body);
      const data = JSON.stringify(body.data);

      await sql`
        INSERT INTO solhub_sync (token, data, updated_at) 
        VALUES (${universalKey}, ${data}::jsonb, NOW())
        ON CONFLICT (token) 
        DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      `;

      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, body: 'Método não permitido' };
  } catch (error) {
    console.error('Erro na sincronização:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
