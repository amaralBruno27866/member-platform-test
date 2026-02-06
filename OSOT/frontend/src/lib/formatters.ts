/**
 * Formata número de telefone para o padrão canadense (XXX) XXX-XXXX
 * Remove todos os caracteres não numéricos e aplica a máscara
 * @param value - String com o número de telefone (pode conter formatação ou não)
 * @returns String formatada no padrão (XXX) XXX-XXXX ou string vazia
 */
export function formatPhoneNumber(value: string): string {
  if (!value) return '';
  
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 10 dígitos
  const limitedNumbers = numbers.slice(0, 10);
  
  // Aplica a máscara conforme o usuário digita
  if (limitedNumbers.length === 0) return '';
  if (limitedNumbers.length <= 3) return `(${limitedNumbers}`;
  if (limitedNumbers.length <= 6) {
    return `(${limitedNumbers.slice(0, 3)}) ${limitedNumbers.slice(3)}`;
  }
  
  return `(${limitedNumbers.slice(0, 3)}) ${limitedNumbers.slice(3, 6)}-${limitedNumbers.slice(6)}`;
}

/**
 * Remove formatação do telefone, retornando apenas números
 * @param value - String com telefone formatado
 * @returns String com apenas dígitos
 */
export function unformatPhoneNumber(value: string): string {
  if (!value) return '';
  return value.replace(/\D/g, '');
}
