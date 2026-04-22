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

    return [
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://icon.horse/icon/${domain}`,
      `${urlObj.origin}/favicon.ico`,
    ];
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
