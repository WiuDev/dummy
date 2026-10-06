// Formatadores em pt-BR. Os preços da API estão em dólar e são exibidos assim,
// sem conversão (A5).
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'USD',
})

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  maximumFractionDigits: 0,
})

// As datas da API vêm em UTC; o fuso fixo evita que o dia mude conforme a
// máquina de quem abre a página.
const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'long',
  timeZone: 'UTC',
})

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

// Recebe o percentual como a API manda (10.48 para 10,48%).
export function formatPercent(value: number): string {
  return percentFormatter.format(value / 100)
}

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate))
}
