import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchAuthors,
  fetchByAuthor,
  fetchBlueprint,
  selectTopBlueprints,
} from '../features/blueprints/blueprintsSlice.js'
import BlueprintCanvas from '../components/BlueprintCanvas.jsx'

export default function BlueprintsPage() {
  const dispatch = useDispatch()
  const { authors, byAuthor, current, status, error } = useSelector((s) => s.blueprints)
  const topBlueprints = useSelector(selectTopBlueprints)
  const [authorInput, setAuthorInput] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState('')
  const [selectedBlueprint, setSelectedBlueprint] = useState(null)
  const items = byAuthor[selectedAuthor] || []

  useEffect(() => {
    dispatch(fetchAuthors())
  }, [dispatch])

  const totalPoints = useMemo(
    () => items.reduce((acc, bp) => acc + (bp.points?.length || 0), 0),
    [items],
  )

  const searchAuthor = (author) => {
    if (!author) return
    setSelectedAuthor(author)
    dispatch(fetchByAuthor(author))
  }

  const getBlueprints = () => searchAuthor(authorInput)

  const selectAuthorFromList = (e) => {
    const author = e.target.value
    if (!author) return
    setAuthorInput(author)
    searchAuthor(author)
  }

  const retryGetBlueprints = () => {
    if (selectedAuthor) dispatch(fetchByAuthor(selectedAuthor))
  }

  const openBlueprint = (bp) => {
    const target = { author: bp.author, name: bp.name }
    setSelectedBlueprint(target)
    dispatch(fetchBlueprint(target))
  }

  const retryOpenBlueprint = () => {
    if (selectedBlueprint) dispatch(fetchBlueprint(selectedBlueprint))
  }

  const retryFetchAuthors = () => dispatch(fetchAuthors())

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
          {!!authors.length && (
            <div className="form-field">
              <label htmlFor="author-select">O elige un autor de la lista</label>
              <select id="author-select" className="input" value="" onChange={selectAuthorFromList}>
                <option value="">-- Selecciona un autor --</option>
                {authors.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="card">
          <h3>{selectedAuthor ? `${selectedAuthor}'s blueprints:` : 'Results'}</h3>
          {status.byAuthor === 'loading' && <p>Cargando...</p>}
          {status.byAuthor === 'failed' && error.byAuthor && (
            <div className="error-banner">
              <span>Error al cargar los blueprints: {error.byAuthor}</span>
              <button className="btn" onClick={retryGetBlueprints}>
                Reintentar
              </button>
            </div>
          )}
          {!selectedAuthor && <p>Busca un autor para ver sus planos.</p>}
          {selectedAuthor && !items.length && status.byAuthor === 'succeeded' && (
            <p>Sin resultados.</p>
          )}
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
          {selectedAuthor && !!items.length && (
            <p className="total-points">Total user points: {totalPoints}</p>
          )}
        </div>

        <div className="card">
          <h3>Top 5 blueprints por cantidad de puntos</h3>
          {status.authors === 'failed' && error.authors && (
            <div className="error-banner">
              <span>Error al cargar el catálogo: {error.authors}</span>
              <button className="btn" onClick={retryFetchAuthors}>
                Reintentar
              </button>
            </div>
          )}
          {status.authors !== 'failed' && !topBlueprints.length && (
            <p>Aún no hay datos suficientes.</p>
          )}
          {status.authors !== 'failed' && !!topBlueprints.length && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Autor</th>
                    <th>Nombre</th>
                    <th className="align-right">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {topBlueprints.map((bp) => (
                    <tr
                      key={`${bp.author}-${bp.name}`}
                      className="clickable-row"
                      onClick={() => openBlueprint(bp)}
                    >
                      <td>{bp.author}</td>
                      <td>{bp.name}</td>
                      <td className="align-right">{bp.points?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
        {status.current === 'loading' && <p>Cargando plano...</p>}
        {status.current === 'failed' && error.current && (
          <div className="error-banner">
            <span>Error al cargar el plano: {error.current}</span>
            <button className="btn" onClick={retryOpenBlueprint}>
              Reintentar
            </button>
          </div>
        )}
        <div className="form-field">
          <BlueprintCanvas
            id="canvas-blueprint"
            points={current?.points || []}
            width={520}
            height={360}
          />
        </div>
      </section>
    </div>
  )
}
