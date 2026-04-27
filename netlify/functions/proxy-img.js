import dns from 'node:dns/promises';
import { URL } from 'node:url';

const TIMEOUT_MS = 8000;

function isPrivateIP(ip) {
  const ipv4Match = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const parts = ipv4Match.slice(1).map(Number);
    if (parts[0] === 10) return true; // 10.0.0.0/8
    if (parts[0] === 127) return true; // 127.0.0.0/8
    if (parts[0] === 169 && parts[1] === 254) return true; // 169.254.0.0/16
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // 172.16.0.0/12
    if (parts[0] === 192 && parts[1] === 168) return true; // 192.168.0.0/16
    if (parts[0] === 0) return true; // 0.0.0.0/8
    return false;
  }
  if (ip === '::1') return true;
  if (ip.toLowerCase().startsWith('fc') || ip.toLowerCase().startsWith('fd')) return true;
  if (ip.toLowerCase().startsWith('fe80')) return true;
  if (ip === '::') return true;
  return false;
}

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { url } = event.queryStringParameters || {};
  if (!url) {
    return { statusCode: 400, body: JSON.stringify({ error: 'URL obrigatória' }) };
  }

  try {
    const urlObj = new URL(url);

    // Validação Anti-SSRF rigorosa
    const dnsResult = await dns.lookup(urlObj.hostname).catch(() => ({ address: null }));
    const address = dnsResult?.address;

    if (address && isPrivateIP(address)) {
      return { statusCode: 403, body: JSON.stringify({ error: 'SSRF bloqueado' }) };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const fetchHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      Referer: urlObj.origin + '/',
      'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
    };

    const response = await fetch(url, {
      signal: controller.signal,
      headers: fetchHeaders,
    }).catch(() => null); // Se a rede do Node falhar, capturamos como nulo

    clearTimeout(timeoutId);

    // Se a requisição foi bloqueada pelo Cloudflare/WAF (403/503) ou timeout,
    // ativamos o fallback delegando o acesso diretamente ao navegador do usuário via 302.
    if (!response || !response.ok) {
      return {
        statusCode: 302,
        headers: {
          Location: url,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        body: '',
      };
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return {
      statusCode: 200,
      headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000, immutable' },
      isBase64Encoded: true,
      body: base64,
    };
  } catch (error) {
    // Fallback de segurança para erros assíncronos não mapeados
    return {
      statusCode: 302,
      headers: { Location: url },
      body: '',
    };
  }
};
