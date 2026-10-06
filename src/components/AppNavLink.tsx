import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import classes from './AppNavLink.module.css'

export interface AppNavLinkProps {
  readonly to: string
  readonly children: ReactNode
  // Com end, o link só fica ativo na rota exata (não nas filhas).
  readonly end?: boolean
  readonly onClick?: () => void
  // State da navegação (ex.: o from que o login usa para voltar).
  readonly state?: unknown
  // Nome acessível quando o texto visível não basta (ex.: o contador do
  // carrinho) ou não existe (só o ícone). Se houver texto visível, o nome deve
  // começar por ele.
  readonly 'aria-label'?: string
}

// Item de navegação persistente. O NavLink do React Router marca a rota ativa
// com aria-current="page", que o CSS Module usa para destacar o item.
export function AppNavLink({
  to,
  children,
  end = false,
  onClick,
  state,
  'aria-label': ariaLabel,
}: AppNavLinkProps) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      state={state}
      aria-label={ariaLabel}
      className={classes.link}
    >
      {children}
    </NavLink>
  )
}
