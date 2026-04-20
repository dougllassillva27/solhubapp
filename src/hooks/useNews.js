import { useState, useEffect, useCallback } from 'react'

const rssFeeds = {
  technology: 'https://feeds.feedburner.com/TechCrunch',
  science: 'https://www.sciencedaily.com/rss/all.xml',
  entertainment: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',
  business: 'https://feeds.bbci.co.uk/news/business/rss.xml',
  health: 'https://feeds.bbci.co.uk/news/health/rss.xml',
  sports: 'https://feeds.bbci.co.uk/sport/rss.xml',
}

export function useNews({ provider, apiKey, topics }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchNews = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      if (provider === 'gnews' && apiKey) {
        const topic = topics[0] || 'technology'
        const url = `https://gnews.io/api/v4/top-headlines?topic=${topic}&lang=pt&token=${apiKey}&max=5`
        
        const response = await fetch(url)
        const data = await response.json()
        
        if (data.articles) {
          setItems(data.articles.map(article => ({
            title: article.title,
            url: article.url,
            source: article.source.name,
            publishedAt: article.publishedAt,
          })))
        }
      } else {
        const topic = topics[0] || 'technology'
        const feedUrl = rssFeeds[topic] || rssFeeds.technology
        
        const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`
        
        const response = await fetch(url)
        const data = await response.json()
        
        if (data.items) {
          setItems(data.items.slice(0, 5).map(item => ({
            title: item.title,
            url: item.link,
            source: item.author || new URL(feedUrl).hostname,
            publishedAt: item.pubDate,
          })))
        }
      }
    } catch (err) {
      setError(err.message)
    }

    setLoading(false)
  }, [provider, apiKey, topics])

  useEffect(() => {
    fetchNews()
    const interval = setInterval(fetchNews, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchNews])

  return { items, loading, error, refetch: fetchNews }
}
