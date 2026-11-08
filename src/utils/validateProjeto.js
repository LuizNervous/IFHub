// validateProjeto.js
// Regras do formulário. São PURAS (só recebem dados e devolvem mensagens), por isso
// ficam fora dos componentes e são fáceis de testar.
//
// ATENÇÃO: estas regras existem só para dar feedback rápido ao usuário.
// Quem realmente decide é o back-end (Edge Function + banco), que repete tudo.
// Os limites abaixo precisam ser iguais aos de supabase/functions/enviar-projeto/validacao.ts.

import { isSafeUrl } from "./isSafeUrl";

export const LIMITES = {
  titulo: { min: 3, max: 120 },
  descricao: { min: 20, max: 1000 },
  orientador: { min: 2, max: 100 },
  url: { max: 500 },
  tecnologias: { min: 1, max: 8 },
  integrantes: { min: 1, max: 10 },
  integranteNome: { min: 2, max: 100 },
  integranteFuncao: { min: 2, max: 60 },
  destaques: { max: 6 },
  destaque: { min: 3, max: 300 },
  email: { max: 254 },
};

export const MSG_PRECISA_LINK =
  "Informe o link do site ou do repositório (pelo menos um).";

// Texto de uma linha: tira espaços das pontas e junta espaços repetidos.
const linha = (texto) => String(texto ?? "").replace(/\s+/g, " ").trim();

// Confere o tamanho de um texto. Devolve a mensagem de erro, ou null se estiver ok.
function checarTamanho(texto, { min, max }, nome) {
  if (texto.length === 0) return `Preencha o campo “${nome}”.`;
  if (texto.length < min) return `“${nome}” precisa ter pelo menos ${min} caracteres.`;
  if (texto.length > max) return `“${nome}” pode ter no máximo ${max} caracteres.`;
  return null;
}

// Campo opcional: vazio é aceito; preenchido segue as regras de tamanho.
function checarOpcional(texto, limites, nome) {
  return texto === "" ? null : checarTamanho(texto, limites, nome);
}

function validarUrl(valor, nome) {
  const texto = linha(valor);
  if (texto === "") return null; // o "pelo menos um dos dois" é checado à parte

  if (texto.length > LIMITES.url.max) {
    return `O link de “${nome}” pode ter no máximo ${LIMITES.url.max} caracteres.`;
  }
  if (!isSafeUrl(texto)) {
    return `O link de “${nome}” precisa ser um endereço completo, começando com http:// ou https://.`;
  }

  const url = new URL(texto);
  if (url.username || url.password) {
    return `O link de “${nome}” não pode conter usuário e senha.`;
  }

  const host = url.hostname.toLowerCase();
  const pareceDominio = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z][a-z0-9-]*[a-z0-9]$/.test(host);
  const interno = /(^|\.)(localhost|local|internal|lan|home|corp)$/.test(host);
  if (!pareceDominio || interno) {
    return `O link de “${nome}” precisa ser de um site com domínio (não aceitamos IP nem localhost).`;
  }
  return null;
}

/**
 * Valida o formulário inteiro. Devolve um objeto { chave: mensagem }.
 * As chaves são as mesmas que o back-end devolve: "titulo", "integrantes.0.nome" etc.
 * Objeto vazio = tudo certo.
 */
export function validarProjeto(v) {
  const erros = {};
  const marcar = (chave, mensagem) => {
    if (mensagem) erros[chave] = mensagem;
  };

  marcar("titulo", checarTamanho(linha(v.titulo), LIMITES.titulo, "título"));
  marcar("descricao", checarTamanho(String(v.descricao ?? "").trim(), LIMITES.descricao, "descrição"));
  if (!v.turma) erros.turma = "Escolha a turma do projeto.";
  marcar("orientador", checarOpcional(linha(v.orientador), LIMITES.orientador, "orientador"));

  const erroSite = validarUrl(v.site_url, "site");
  const erroRepo = validarUrl(v.repo_url, "repositório");
  marcar("site_url", erroSite);
  marcar("repo_url", erroRepo);
  if (!linha(v.site_url) && !linha(v.repo_url)) erros.site_url = MSG_PRECISA_LINK;

  if (v.tecnologias.length < LIMITES.tecnologias.min) {
    erros.tecnologias = "Escolha ao menos uma tecnologia.";
  } else if (v.tecnologias.length > LIMITES.tecnologias.max) {
    erros.tecnologias = `Escolha no máximo ${LIMITES.tecnologias.max} tecnologias.`;
  }

  if (v.integrantes.length < LIMITES.integrantes.min) {
    erros.integrantes = "Informe ao menos um integrante.";
  }
  v.integrantes.forEach((membro, i) => {
    marcar(`integrantes.${i}.nome`, checarTamanho(linha(membro.nome), LIMITES.integranteNome, "nome do integrante"));
    marcar(`integrantes.${i}.funcao`, checarOpcional(linha(membro.funcao), LIMITES.integranteFuncao, "função do integrante"));
  });

  v.destaques.forEach((destaque, i) => {
    const texto = linha(destaque.texto);
    if (texto !== "") marcar(`destaques.${i}`, checarTamanho(texto, LIMITES.destaque, "destaque"));
  });

  const email = linha(v.email_contato);
  if (email === "") {
    erros.email_contato = "Informe seu e-mail de contato.";
  } else if (email.length > LIMITES.email.max || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    erros.email_contato = "Informe um e-mail válido.";
  }

  return erros;
}

/**
 * Transforma o estado do formulário no objeto "projeto" que o back-end espera.
 * Só inclui campos opcionais que foram preenchidos, e NUNCA inclui status, id ou likes.
 */
export function montarPayload(v) {
  const projeto = {
    titulo: linha(v.titulo),
    descricao: String(v.descricao).trim(),
    turma: v.turma,
    tecnologias: v.tecnologias,
    integrantes: v.integrantes.map((membro) => {
      const funcao = linha(membro.funcao);
      return funcao ? { nome: linha(membro.nome), funcao } : { nome: linha(membro.nome) };
    }),
    destaques: v.destaques.map((d) => linha(d.texto)).filter(Boolean),
  };

  const orientador = linha(v.orientador);
  const site = linha(v.site_url);
  const repo = linha(v.repo_url);
  if (orientador) projeto.orientador = orientador;
  if (site) projeto.site_url = site;
  if (repo) projeto.repo_url = repo;

  return projeto;
}