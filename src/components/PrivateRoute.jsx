import { Navigate, useLocation } from 'react-router-dom'
import { getToken } from '../auth/session.js'

export default function PrivateRoute({ children }) {
  const location = useLocation()
  const token = getToken()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
