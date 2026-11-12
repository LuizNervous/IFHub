import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const STATUS = ["pendente", "aprovado", "rejeitado"];

// Carrega os projetos de um status e expõe a ação de moderar.
// Quem decide de verdade é o banco: o SELECT só devolve linhas se a sessão for admin com MFA (RLS),
// e a moderação passa pela função SQL moderar_projeto(), que confere o admin de novo.
export function usePainel(statusFiltro) {
  const [projetos, setProjetos] = useState([]);
  const [carga, setCarga] = useState("carregando"); // "carregando" | "ok" | "erro"
  const [contagens, setContagens] = useState({ pendente: 0, aprovado: 0, rejeitado: 0 });
  const numeroDaConsulta = useRef(0); // ignora respostas antigas se o usuário trocar de aba rápido

  const carregarContagens = useCallback(async () => {
    const respostas = await Promise.all(
      STATUS.map((s) =>
        supabase.from("projetos").select("id", { count: "exact", head: true }).eq("status", s),
      ),
    );
    setContagens({
      pendente: respostas[0].count ?? 0,
      aprovado: respostas[1].count ?? 0,
      rejeitado: respostas[2].count ?? 0,
    });
  }, []);

  const carregar = useCallback(async () => {
    const minha = ++numeroDaConsulta.current;
    setCarga("carregando");

    const { data, error } = await supabase
      .from("projetos")
      .select(
        `id, titulo, descricao, status, imagem_url, site_url, repo_url, criado_em, revisado_em,
         turmas ( nome ),
         integrantes ( nome, funcao ),
         destaques ( texto ),
         projeto_tecnologias ( tecnologias ( nome ) ),
         projeto_submissoes ( email_contato, motivo_rejeicao )`,
      )
      .eq("status", statusFiltro)
      .order("criado_em", { ascending: false });

    if (minha !== numeroDaConsulta.current) return; // chegou atrasada: descarta
    if (error) {
      setCarga("erro");
      return;
    }
    setProjetos(data ?? []);
    setCarga("ok");
  }, [statusFiltro]);

  useEffect(() => {
    carregar();
    carregarContagens();
  }, [carregar, carregarContagens]);

  const moderar = async (projetoId, acao, motivo = null) => {
    const { error } = await supabase.rpc("moderar_projeto", {
      p_projeto_id: projetoId,
      p_acao: acao,
      p_motivo: motivo,
    });
    if (error) throw new Error(traduzirErro(error.message));
    setProjetos((anterior) => anterior.filter((p) => p.id !== projetoId));
    carregarContagens();
  };

  return { projetos, carga, contagens, carregar, moderar };
}

// As mensagens do banco são códigos; aqui viram texto para o admin.
function traduzirErro(codigo) {
  const mapa = {
    NAO_AUTORIZADO: "Sua sessão não tem permissão para moderar. Saia e entre de novo.",
    MOTIVO_OBRIGATORIO: "Informe o motivo da rejeição.",
    ACAO_INVALIDA: "Ação inválida.",
    PROJETO_NAO_ENCONTRADO_OU_JA_MODERADO: "Este projeto já foi moderado (talvez por outro admin). Atualize a lista.",
  };
  return mapa[codigo] ?? "Não foi possível concluir. Tente novamente.";
}
