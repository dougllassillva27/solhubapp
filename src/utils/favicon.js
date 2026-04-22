export const getFaviconUrls = (url) => {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    const isLocal =
      domain === 'localhost' ||
      !domain.includes('.') ||
      /\.(local|lan|test|dashboard|home|corp)$/.test(domain) ||
      domain.match(/^(127|192\.168|10|172\.(1[6-9]|2[0-9]|3[0-1]))\./);

    if (isLocal) {
      return [`${urlObj.origin}/favicon.ico`, `${urlObj.origin}/favicon.png`];
    }

    let rootDomain = domain;
    const parts = domain.split('.');
    if (parts.length > 2) {
      if (parts[parts.length - 2].length <= 3 && parts[parts.length - 1].length <= 3) {
        rootDomain = parts.slice(-3).join('.');
      } else {
        rootDomain = parts.slice(-2).join('.');
      }
    }

    // Fontes confiáveis: Google retorna 404 real para domínios sem favicon (correto).
    // DuckDuckGo REMOVIDO: retorna globo placeholder com HTTP 200, envenenando o cache.
    const urls = [`https://www.google.com/s2/favicons?domain=${domain}&sz=128`];

    if (rootDomain !== domain) {
      urls.push(`https://www.google.com/s2/favicons?domain=${rootDomain}&sz=128`);
    }

    // icon.horse como penúltimo recurso (pode ter rate limit, mas retorna 404 real)
    urls.push(`https://icon.horse/icon/${domain}`, `${urlObj.origin}/favicon.ico`);

    return urls;
  } catch {
    return [];
  }
};

export const getDomain = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};
