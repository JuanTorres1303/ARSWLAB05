import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchAuthors,
  fetchByAuthor,
  fetchBlueprint,
} from '../features/blueprints/blueprintsSlice.js'
import BlueprintCanvas from '../components/BlueprintCanvas.jsx'

export default function BlueprintsPage() {
  const dispatch = useDispatch()
  const { byAuthor, current, status } = useSelector((s) => s.blueprints)
  const [authorInput, setAuthorInput] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState('')
  const items = byAuthor[selectedAuthor] || []

  useEffect(() => {
    dispatch(fetchAuthors())
  }, [dispatch])

  const totalPoints = useMemo(
    () => items.reduce((acc, bp) => acc + (bp.points?.length || 0), 0),
    [items],
  )

  const getBlueprints = () => {
    if (!authorInput) return
    setSelectedAuthor(authorInput)
    dispatch(fetchByAuthor(authorInput))
  }

  const openBlueprint = (bp) => {
    dispatch(fetchBlueprint({ author: bp.author, name: bp.name }))
  }

  return (
    <div className="page-grid">
      <section className="section-stack">
        <div className="card">
          <h2>Blueprints</h2>
          <div className="search-bar">
            <input
              className="input"
              placeholder="Author"
              value={authorInput}
              onChange={(e) => setAuthorInput(e.target.value)}
            />
            <button className="btn primary" onClick={getBlueprints}>
              Get blueprints
            </button>
          </div>
        </div>

        <div className="card">
          <h3>{selectedAuthor ? `${selectedAuthor}'s blueprints:` : 'Results'}</h3>
          {status === 'loading' && <p>Cargando...</p>}
          {!items.length && status !== 'loading' && <p>Sin resultados.</p>}
          {!!items.length && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Blueprint name</th>
                    <th className="align-right">Number of points</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((bp) => (
                    <tr key={bp.name}>
                      <td>{bp.name}</td>
                      <td className="align-right">{bp.points?.length || 0}</td>
                      <td>
                        <button className="btn" onClick={() => openBlueprint(bp)}>
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="total-points">Total user points: {totalPoints}</p>
        </div>
      </section>

      <section className="card">
        <h3>Current blueprint</h3>
        <div className="form-field">
          <label htmlFor="current-blueprint-name">Nombre del plano actual</label>
          <input
            id="current-blueprint-name"
            className="input"
            value={current?.name || ''}
            readOnly
          />
        </div>
        <div className="form-field">
          <BlueprintCanvas id="canvas-blueprint" points={current?.points || []} width={520} height={360} />
        </div>
      </section>
    </div>
  )
}
