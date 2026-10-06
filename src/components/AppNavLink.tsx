import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import classes from './AppNavLink.module.css'

export interface AppNavLinkProps {
  readonly to: string
  readonly children: ReactNode
  // Com end, o link só fica ativo na rota exata (não nas filhas).
  readonly end?: boolean
  readonly onClick?: () => void
}

// Item de navegação persistente. O NavLink do React Router marca a rota ativa
// com aria-current="page", que o CSS Module usa para destacar o item.
export function AppNavLink({
  to,
  children,
  end = false,
  onClick,
}: AppNavLinkProps) {
  return (
    <NavLink to={to} end={end} onClick={onClick} className={classes.link}>
      {children}
    </NavLink>
  )
}
