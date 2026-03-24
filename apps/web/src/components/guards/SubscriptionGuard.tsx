import { Navigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { ReactNode } from "react"

interface Props { children: ReactNode }

export default function SubscriptionGuard({ children }: Props) {
  const { user } = useAuth()
  if (!user?.subscriptionActive) return <Navigate to="/checkout" />
  return <>{children}</>
}