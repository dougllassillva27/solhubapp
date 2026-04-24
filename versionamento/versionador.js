import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações
const diretorioBase = path.resolve(__dirname, '../dist'); // Alvo: pasta de build do Vite
const diretoriosIgnorados = ['node_modules', '.git'];
const extensoesAlvo = ['.html', '.css', '.js', '.json', '.webmanifest'];

// Barreira de segurança: impede erro se dist/ não existir
if (!fs.existsSync(diretorioBase)) {
  console.warn(`[AVISO] Pasta dist/ não encontrada em ${diretorioBase}. Abortando versionamento.`);
  process.exit(0);
}

/**
 * Gera um hash MD5 baseado no conteúdo físico do arquivo.
 */
function gerarHash(caminhoArquivo) {
  const conteudo = fs.readFileSync(caminhoArquivo);
  return crypto.createHash('md5').update(conteudo).digest('hex').substring(0, 8);
}

/**
 * Processa uma URL, injetando o Content Hash se o arquivo físico existir.
 */
function processarUrl(url, caminhoArquivoAtual) {
  if (!url || url.startsWith('http') || url.startsWith('data:') || url.startsWith('#')) {
    return url;
  }

  const partes = url.split('?');
  const urlPura = partes[0].split('#')[0];

  let caminhoFisico;
  if (urlPura.startsWith('/')) {
    caminhoFisico = path.join(diretorioBase, urlPura);
  } else {
    caminhoFisico = path.join(path.dirname(caminhoArquivoAtual), urlPura);
  }

  if (fs.existsSync(caminhoFisico) && fs.statSync(caminhoFisico).isFile()) {
    const hash = gerarHash(caminhoFisico);
    const regexV = /([?&])v=[^&#]*/;

    if (url.match(regexV)) {
      return url.replace(regexV, `$1v=${hash}`);
    } else {
      const separador = url.includes('?') ? '&' : '?';
      if (url.includes('#')) {
        return url.replace('#', `${separador}v=${hash}#`);
      }
      return `${url}${separador}v=${hash}`;
    }
  }
  return url;
}

/**
 * Substitui URLs dentro do conteúdo do arquivo usando Regex.
 */
function processarConteudo(conteudo, caminhoArquivo) {
  // Processa atributos HTML e notações de objeto JS/JSON (href, src, content) com "=" ou ":"
  let novoConteudo = conteudo.replace(
    /(["']?)(href|src|content)\1(\s*[:=]\s*)(['"])(.*?)\4/gi,
    (match, aspasProp, attr, oper, aspasUrl, url) => {
      const prop = aspasProp ? `${aspasProp}${attr}${aspasProp}` : attr;
      return `${prop}${oper}${aspasUrl}${processarUrl(url, caminhoArquivo)}${aspasUrl}`;
    }
  );

  // Processa url() do CSS
  novoConteudo = novoConteudo.replace(/url\((['"]?)(.*?)\1\)/gi, (match, aspas, url) => {
    return `url(${aspas}${processarUrl(url, caminhoArquivo)}${aspas})`;
  });

  // Processa srcset (imagens responsivas)
  novoConteudo = novoConteudo.replace(/srcset=(['"])(.*?)\1/gi, (match, aspas, srcset) => {
    const novoSrcset = srcset
      .split(',')
      .map((parte) => {
        const [url, descritor] = parte.trim().split(/\s+/);
        const urlProcessada = processarUrl(url, caminhoArquivo);
        return descritor ? `${urlProcessada} ${descritor}` : urlProcessada;
      })
      .join(', ');
    return `srcset=${aspas}${novoSrcset}${aspas}`;
  });

  return novoConteudo;
}

/**
 * Varre diretórios recursivamente ignorando pastas configuradas.
 */
function varrerDiretorio(dir) {
  const arquivos = fs.readdirSync(dir);
  arquivos.forEach((arquivo) => {
    const caminhoCompleto = path.join(dir, arquivo);
    const stat = fs.statSync(caminhoCompleto);

    if (stat.isDirectory()) {
      if (!diretoriosIgnorados.includes(arquivo)) {
        varrerDiretorio(caminhoCompleto);
      }
    } else if (extensoesAlvo.includes(path.extname(caminhoCompleto).toLowerCase())) {
      const conteudoOriginal = fs.readFileSync(caminhoCompleto, 'utf-8');
      const conteudoProcessado = processarConteudo(conteudoOriginal, caminhoCompleto);

      if (conteudoOriginal !== conteudoProcessado) {
        fs.writeFileSync(caminhoCompleto, conteudoProcessado, 'utf-8');
        console.log(`[ATUALIZADO] ${caminhoCompleto.replace(diretorioBase, '')}`);
      }
    }
  });
}

console.log('Iniciando versionamento em Build-Time...');
varrerDiretorio(diretorioBase);
console.log('Versionamento concluído com sucesso.');
