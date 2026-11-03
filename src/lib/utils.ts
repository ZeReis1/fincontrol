import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata um número para Real Brasileiro (BRL)
 * Ex: 1250.5 -> "R$ 1.250,50"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Formata data no formato DD/MM/YYYY
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
}

/**
 * Retorna o mês e ano por extenso (Ex: "Novembro de 2026")
 */
export function formatMonthYear(monthYear: string): string {
  if (!monthYear) return '';
  const [year, month] = monthYear.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  const formatted = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Gera um ID único simples
 */
export function generateId(): string {
  return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}
