// Regras para a NOVA senha do admin (usadas na tela de redefinição).
// Comprimento importa mais do que "símbolos obrigatórios": uma frase longa é mais forte e mais fácil de lembrar.
// O limite de 72 existe porque o bcrypt (usado pelo Supabase) ignora o que passa de 72 bytes.
export const SENHA = { min: 12, max: 72 };

export function validarNovaSenha(senha, confirmacao) {
  if (senha.length < SENHA.min) return `A senha precisa ter pelo menos ${SENHA.min} caracteres.`;
  if (new TextEncoder().encode(senha).length > SENHA.max) return `A senha pode ter no máximo ${SENHA.max} caracteres.`;
  if (new Set(senha).size < 6) return "Use mais variedade de caracteres (evite repetições como aaaaaa1).";
  if (!/[A-Za-z]/.test(senha) || !/[0-9]/.test(senha)) return "Misture letras e números na senha.";
  if (senha !== confirmacao) return "As duas senhas não são iguais.";
  return null;
}