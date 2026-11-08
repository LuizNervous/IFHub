import { useState } from "react";
import { enviarProjeto } from "../services/api";
import { LIMITES, MSG_PRECISA_LINK, montarPayload, validarProjeto } from "../utils/validateProjeto";

// Cada linha de uma lista dinâmica precisa de um id ESTÁVEL para o React usar como `key`.
// (Usar o índice como key bagunça os campos quando removemos uma linha do meio.)
let proximoId = 1;
const novoId = () => proximoId++;
const novoIntegrante = () => ({ id: novoId(), nome: "", funcao: "" });
const novoDestaque = () => ({ id: novoId(), texto: "" });

function valoresIniciais() {
  return {
    titulo: "",
    descricao: "",
    turma: "",
    orientador: "",
    site_url: "",
    repo_url: "",
    tecnologias: [],
    integrantes: [novoIntegrante()],
    destaques: [],
    email_contato: "",
    hp: "", // "honeypot": campo-isca escondido. Humanos nunca preenchem.
  };
}

// Depois que os erros aparecem, leva o foco (e o leitor de tela) ao primeiro campo com problema.
function focarPrimeiroErro() {
  requestAnimationFrame(() => {
    document.querySelector('[aria-invalid="true"], [data-invalid="true"]')?.focus();
  });
}

export function useProjetoForm() {
  const [valores, setValores] = useState(valoresIniciais);
  const [erros, setErros] = useState({});
  const [status, setStatus] = useState("preenchendo"); // "preenchendo" | "enviando" | "enviado"
  const [erroGeral, setErroGeral] = useState("");
  const [abertoEm] = useState(() => Date.now()); // para o anti-robô medir o tempo de preenchimento

  // ---------- erros ----------
  const limparErro = (chave) =>
    setErros((anterior) => {
      if (!(chave in anterior)) return anterior;
      const novo = { ...anterior };
      delete novo[chave];
      return novo;
    });

  const limparErrosDe = (prefixo) =>
    setErros((anterior) => {
      const novo = {};
      for (const [chave, mensagem] of Object.entries(anterior)) {
        if (!chave.startsWith(prefixo)) novo[chave] = mensagem;
      }
      return novo;
    });

  // Ao sair de um campo, valida só ele. (Validar a cada tecla irrita; só no envio, esconde cedo demais.)
  const validarAoSair = (chave) => {
    const mensagem = validarProjeto(valores)[chave];
    // "informe um dos links" só aparece no envio, para não assustar quem vai preencher o outro link
    if (mensagem && mensagem !== MSG_PRECISA_LINK) {
      setErros((anterior) => ({ ...anterior, [chave]: mensagem }));
    } else {
      limparErro(chave);
    }
  };

  // ---------- campos simples ----------
  const setCampo = (campo, valor) => {
    setValores((anterior) => ({ ...anterior, [campo]: valor }));
    limparErro(campo);
    if (campo === "site_url" || campo === "repo_url") limparErro("site_url");
  };

  // ---------- tecnologias ----------
  const toggleTecnologia = (nome) => {
    setValores((anterior) => {
      const ja = anterior.tecnologias.includes(nome);
      if (ja) return { ...anterior, tecnologias: anterior.tecnologias.filter((t) => t !== nome) };
      if (anterior.tecnologias.length >= LIMITES.tecnologias.max) return anterior;
      return { ...anterior, tecnologias: [...anterior.tecnologias, nome] };
    });
    limparErro("tecnologias");
  };

  // ---------- integrantes ----------
  const adicionarIntegrante = () =>
    setValores((anterior) =>
      anterior.integrantes.length >= LIMITES.integrantes.max
        ? anterior
        : { ...anterior, integrantes: [...anterior.integrantes, novoIntegrante()] },
    );

  const removerIntegrante = (id) => {
    setValores((anterior) =>
      anterior.integrantes.length <= LIMITES.integrantes.min
        ? anterior
        : { ...anterior, integrantes: anterior.integrantes.filter((m) => m.id !== id) },
    );
    limparErrosDe("integrantes"); // os índices mudaram, então os erros antigos perdem o sentido
  };

  const alterarIntegrante = (id, campo, valor) => {
    const indice = valores.integrantes.findIndex((m) => m.id === id);
    setValores((anterior) => ({
      ...anterior,
      integrantes: anterior.integrantes.map((m) => (m.id === id ? { ...m, [campo]: valor } : m)),
    }));
    limparErro(`integrantes.${indice}.${campo}`);
  };

  // ---------- destaques ----------
  const adicionarDestaque = () =>
    setValores((anterior) =>
      anterior.destaques.length >= LIMITES.destaques.max
        ? anterior
        : { ...anterior, destaques: [...anterior.destaques, novoDestaque()] },
    );

  const removerDestaque = (id) => {
    setValores((anterior) => ({ ...anterior, destaques: anterior.destaques.filter((d) => d.id !== id) }));
    limparErrosDe("destaques");
  };

  const alterarDestaque = (id, texto) => {
    const indice = valores.destaques.findIndex((d) => d.id === id);
    setValores((anterior) => ({
      ...anterior,
      destaques: anterior.destaques.map((d) => (d.id === id ? { ...d, texto } : d)),
    }));
    limparErro(`destaques.${indice}`);
  };

  // ---------- envio ----------
  const enviar = async (evento) => {
    evento.preventDefault(); // impede o navegador de recarregar a página
    if (status === "enviando") return; // protege contra clique duplo

    setErroGeral("");

    // Destaques em branco são descartados ANTES de validar, para os índices
    // dos erros do servidor baterem com os das linhas na tela.
    const limpos = { ...valores, destaques: valores.destaques.filter((d) => d.texto.trim() !== "") };
    setValores(limpos);

    const errosFront = validarProjeto(limpos);
    if (Object.keys(errosFront).length > 0) {
      setErros(errosFront);
      setErroGeral("Confira os campos destacados antes de enviar.");
      focarPrimeiroErro();
      return;
    }

    setErros({});
    setStatus("enviando");

    const resultado = await enviarProjeto({
      projeto: montarPayload(limpos),
      email_contato: limpos.email_contato.trim(),
      hp: limpos.hp,
      tempo_ms: Date.now() - abertoEm,
    });

    if (resultado.ok) {
      setStatus("enviado");
      return;
    }

    // O servidor recusou: mostramos os erros que ele apontou.
    setStatus("preenchendo");
    setErros(resultado.erros);
    setErroGeral(resultado.mensagem);
    if (Object.keys(resultado.erros).length > 0) focarPrimeiroErro();
  };

  const reiniciar = () => {
    setValores(valoresIniciais());
    setErros({});
    setErroGeral("");
    setStatus("preenchendo");
  };

  return {
    valores,
    erros,
    status,
    erroGeral,
    setCampo,
    validarAoSair,
    toggleTecnologia,
    adicionarIntegrante,
    removerIntegrante,
    alterarIntegrante,
    adicionarDestaque,
    removerDestaque,
    alterarDestaque,
    enviar,
    reiniciar,
  };
}