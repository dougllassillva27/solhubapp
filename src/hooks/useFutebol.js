import { useState, useEffect, useCallback } from 'react';
import useStore from '../store/useStore';

export function useFutebol() {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState({ noticias: true });
  const [error, setError] = useState({ noticias: null });

  const fetchNoticias = useCallback(async () => {
    setLoading((prev) => ({ ...prev, noticias: true }));
    setError((prev) => ({ ...prev, noticias: null }));
    try {
      const state = useStore.getState();
      const rssUrl = state.futebolRssUrl;
      const url = `/.netlify/functions/futebol-noticias${rssUrl ? `?url=${encodeURIComponent(rssUrl)}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Falha ao buscar notícias de futebol');
      }
      const data = await response.json();
      setNoticias(data.itens || []);
    } catch (err) {
      setError((prev) => ({ ...prev, noticias: err.message }));
    } finally {
      setLoading((prev) => ({ ...prev, noticias: false }));
    }
  }, []);

  useEffect(() => {
    fetchNoticias();
  }, [fetchNoticias]);

  return { noticias, loading, error, fetchNoticias };
}
