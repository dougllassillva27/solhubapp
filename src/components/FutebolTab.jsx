import { Newspaper, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useFutebol } from '../hooks/useFutebol';
import NoticiasFutebol from './NoticiasFutebol';

const LoadingState = () => (
  <div className="flex justify-center items-center p-8 bg-card border border-border rounded-xl">
    <Loader2 size={24} className="animate-spin text-muted" />
  </div>
);

const ErrorState = ({ message }) => (
  <div className="bg-card border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
    <AlertCircle size={20} />
    <span>{message}</span>
  </div>
);

const EmptyState = ({ message }) => (
  <div className="bg-card border border-border rounded-xl p-4 text-center text-muted text-sm">{message}</div>
);

export default function FutebolTab() {
  const { noticias, jogos, loading, error, fetchNoticias, fetchJogos } = useFutebol();

  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
      {/* Coluna de Jogos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text flex items-center gap-2">
            <Trophy size={20} />
            Jogos de Hoje
          </h2>
          <button
            onClick={() => fetchJogos(true)}
            disabled={loading.jogos}
            className="p-2 text-muted hover:text-accent transition-colors disabled:opacity-50"
            title="Buscar jogos"
          >
            <RefreshCw size={16} className={loading.jogos ? 'animate-spin' : ''} />
          </button>
        </div>
        {loading.jogos ? (
          <LoadingState />
        ) : error.jogos ? (
          <ErrorState message={error.jogos} />
        ) : jogos.length > 0 ? (
          <JogosHoje jogos={jogos} />
        ) : (
          <EmptyState message="Nenhum jogo encontrado no momento." />
        )}
      </div>

      {/* Coluna de Notícias */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text flex items-center gap-2">
            <Newspaper size={20} />
            Notícias de Futebol
          </h2>
          <button
            onClick={fetchNoticias}
            disabled={loading.noticias}
            className="p-2 text-muted hover:text-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading.noticias ? 'animate-spin' : ''} />
          </button>
        </div>
        {loading.noticias ? (
          <LoadingState />
        ) : error.noticias ? (
          <ErrorState message={error.noticias} />
        ) : noticias.length > 0 ? (
          <NoticiasFutebol noticias={noticias} />
        ) : (
          <EmptyState message="Nenhuma notícia encontrada." />
        )}
      </div>
    </div>
  );
}
