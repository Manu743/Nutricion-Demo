// Normaliza texto para búsquedas: minúsculas y sin acentos ni diacríticos.
// "Piña" -> "pina", "Azúcar" -> "azucar".
export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}
