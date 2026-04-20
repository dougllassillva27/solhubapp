# Nebula Start

Uma página inicial personalizada e moderna para seu navegador.

## Funcionalidades

- **Relógio e Data** - Exibição em tempo real com formato localizado em português
- **Barra de Pesquisa** - 6 provedores (Google, Bing, DuckDuckGo, YouTube, Brave, Ecosia) com ciclo via Tab
- **Cards de Sites** - Adicione, edite, remova e reordene seus sites favoritos com drag and drop
- **Filtro de Categorias** - Organize seus sites por categorias personalizadas
- **Feed de Notícias** - RSS gratuito ou GNews API com tópicos de interesse
- **7 Temas** - Minimal Light/Dark, Space (com estrelas animadas), Hacking, Nord, Sunset, Cyberpunk
- **Export/Import** - Compartilhe sua configuração entre dispositivos

## Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build
```

## Uso como Página Inicial

### Desenvolvimento
1. Execute `npm run dev`
2. Configure seu navegador para abrir `http://localhost:5173` na inicialização

### Produção
1. Execute `npm run build`
2. Sirva a pasta `dist/` com qualquer servidor estático:
   ```bash
   npx serve dist
   ```
3. Configure a URL no navegador

## Deploy

### Netlify
1. Conecte seu repositório GitHub
2. Build command: `npm run build`
3. Publish directory: `dist`

### Vercel
1. Importe o projeto do GitHub
2. Framework preset: Vite

### GitHub Pages
1. Instale `gh-pages`: `npm install -D gh-pages`
2. Adicione ao `package.json`:
   ```json
   "homepage": "https://seu-usuario.github.io/nebula-startpage",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
3. Execute `npm run deploy`

## Estrutura de Dados (localStorage)

```js
{
  "sp_sites": [{ id, name, url, category, order }],
  "sp_categories": ["dev", "trabalho", ...],
  "sp_theme": "minimal-dark",
  "sp_search_provider": 0,
  "sp_news_provider": "rss",
  "sp_news_apikey": "",
  "sp_news_topics": ["technology"],
  "sp_active_category": "all"
}
```

## Tecnologias

- **React 18** - Framework UI
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **Zustand** - Gerenciamento de estado
- **dnd-kit** - Drag and drop
- **Lucide React** - Ícones

## Licença

MIT
