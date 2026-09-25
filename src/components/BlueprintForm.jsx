import { useState } from 'react'

function validate(author, name, pointsJSON) {
  const errors = {}
  if (!author.trim()) errors.author = 'El autor es obligatorio'
  if (!name.trim()) errors.name = 'El nombre es obligatorio'

  let points = null
  try {
    const parsed = JSON.parse(pointsJSON)
    if (!Array.isArray(parsed)) throw new Error('El JSON de puntos debe ser un arreglo')
    points = parsed
  } catch {
    errors.points = 'El JSON de puntos no es válido'
  }

  return { errors, points }
}

export default function BlueprintForm({ onSubmit }) {
  const [author, setAuthor] = useState('')
  const [name, setName] = useState('')
  const [pointsJSON, setPointsJSON] = useState('[{"x":10,"y":10},{"x":40,"y":60}]')
  const [errors, setErrors] = useState({})

  const handle = (e) => {
    e.preventDefault()
    const { errors: nextErrors, points } = validate(author, name, pointsJSON)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSubmit({ author, name, points })
  }

  return (
    <form onSubmit={handle} className="card">
      <h3>Crear Blueprint</h3>
      <div className="grid cols-2">
        <div>
          <label htmlFor="author">Autor</label>
          <input
            id="author"
            className="input"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="juan.perez"
          />
          {errors.author && <p className="error-text">{errors.author}</p>}
        </div>
        <div>
          <label htmlFor="name">Nombre</label>
          <input
            id="name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="mi-dibujo"
          />
          {errors.name && <p className="error-text">{errors.name}</p>}
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="points">Puntos (JSON)</label>
        <textarea
          id="points"
          className="input"
          rows="5"
          value={pointsJSON}
          onChange={(e) => setPointsJSON(e.target.value)}
        />
        {errors.points && <p className="error-text">{errors.points}</p>}
      </div>
      <div className="form-field">
        <button className="btn primary">Guardar</button>
      </div>
    </form>
  )
}
