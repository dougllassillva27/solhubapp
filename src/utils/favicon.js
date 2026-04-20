export const getFaviconUrl = (url) => {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch {
    return null
  }
}

export const getDomain = (url) => {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
