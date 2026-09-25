import { NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import BlueprintsPage from './pages/BlueprintsPage.jsx'
import BlueprintDetailPage from './pages/BlueprintDetailPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NewBlueprintPage from './pages/NewBlueprintPage.jsx'
import NotFound from './pages/NotFound.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'
import { clearToken, useAuth } from './auth/session.js'

export default function App() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearToken()
    navigate('/login')
  }

  return (
    <div className="container">
      <header>
        <h1>ECI - Laboratorio de Blueprints en React</h1>
        <nav>
          <NavLink to="/" end>
            Blueprints
          </NavLink>
          {isAuthenticated && <NavLink to="/blueprints/new">Nuevo blueprint</NavLink>}
          {isAuthenticated ? (
            <button className="btn" onClick={handleLogout}>
              Cerrar sesión
            </button>
          ) : (
            <NavLink to="/login">Login</NavLink>
          )}
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<BlueprintsPage />} />
        <Route path="/blueprints/:author/:name" element={<BlueprintDetailPage />} />
        <Route
          path="/blueprints/new"
          element={
            <PrivateRoute>
              <NewBlueprintPage />
            </PrivateRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}
