import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import BlueprintForm from '../components/BlueprintForm.jsx'
import { createBlueprint } from '../features/blueprints/blueprintsSlice.js'

export default function NewBlueprintPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  const handleSubmit = async (payload) => {
    setError(null)
    try {
      await dispatch(createBlueprint(payload)).unwrap()
      navigate('/')
    } catch (err) {
      setError(typeof err === 'string' ? err : 'No se pudo crear el blueprint')
    }
  }

  return (
    <div className="card">
      <h2>Nuevo blueprint</h2>
      {error && <p className="error-text">{error}</p>}
      <BlueprintForm onSubmit={handleSubmit} />
    </div>
  )
}
