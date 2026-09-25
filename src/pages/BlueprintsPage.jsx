import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  deleteBlueprint,
  fetchAuthors,
  fetchByAuthor,
  fetchBlueprint,
  selectTopBlueprints,
  updateBlueprint,
} from '../features/blueprints/blueprintsSlice.js'
import BlueprintCanvas from '../components/BlueprintCanvas.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { useAuth } from '../auth/session.js'

export default function BlueprintsPage() {
  const dispatch = useDispatch()
  const { authors, byAuthor, current, status, error } = useSelector((s) => s.blueprints)
  const topBlueprints = useSelector(selectTopBlueprints)
  const { isAuthenticated } = useAuth()
  const [authorInput, setAuthorInput] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState('')
  const [selectedBlueprint, setSelectedBlueprint] = useState(null)
  const [draftPoints, setDraftPoints] = useState([])
  const [dirty, setDirty] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [openedKey, setOpenedKey] = useState(null)
  const items = byAuthor[selectedAuthor] || []

  useEffect(() => {
    dispatch(fetchAuthors())
  }, [dispatch])

  // Solo reinicia el borrador cuando cambia el blueprint abierto (autor+nombre),
  // no en cada cambio optimista de "current" mientras se guarda/revierte.
  useEffect(() => {
    const key = current ? `${current.author}::${current.name}` : null
    if (key !== openedKey) {
      setOpenedKey(key)
      setDraftPoints(current?.points || [])
      setDirty(false)
      setSaveError(null)
    }
  }, [current, openedKey])

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
    const target = { author: bp.author || selectedAuthor, name: bp.name }
    setSelectedBlueprint(target)
    dispatch(fetchBlueprint(target))
  }

  const retryOpenBlueprint = () => {
    if (selectedBlueprint) dispatch(fetchBlueprint(selectedBlueprint))
  }

  const retryFetchAuthors = () => dispatch(fetchAuthors())

  const handleAddPoint = (point) => {
    if (!current) return
    setDraftPoints((prev) => [...prev, point])
    setDirty(true)
  }

  const handleUndoPoint = () => {
    setDraftPoints((prev) => prev.slice(0, -1))
    setDirty(true)
  }

  const handleDiscardChanges = () => {
    setDraftPoints(current?.points || [])
    setDirty(false)
    setSaveError(null)
  }

  const handleSaveChanges = async () => {
    if (!current) return
    setSaveError(null)
    try {
      await dispatch(
        updateBlueprint({ author: current.author, name: current.name, points: draftPoints }),
      ).unwrap()
      setDirty(false)
    } catch (err) {
      setSaveError(typeof err === 'string' ? err : 'No se pudo guardar el blueprint')
    }
  }

  const requestDelete = (bp) => {
    setDeleteError(null)
    setConfirmTarget({ author: bp.author || selectedAuthor, name: bp.name })
  }

  const confirmDeleteBlueprint = async () => {
    const target = confirmTarget
    setConfirmTarget(null)
    if (!target) return
    setDeleteError(null)
    try {
      await dispatch(deleteBlueprint(target)).unwrap()
    } catch (err) {
      setDeleteError(typeof err === 'string' ? err : 'No se pudo eliminar el blueprint')
    }
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
          {status.authors === 'unsupported' && (
            <p>Selector de autores no disponible con este backend.</p>
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
                        {isAuthenticated && (
                          <>
                            <button className="btn" onClick={() => openBlueprint(bp)}>
                              Editar
                            </button>
                            <button className="btn danger" onClick={() => requestDelete(bp)}>
                              Eliminar
                            </button>
                          </>
                        )}
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
          {deleteError && <p className="error-text">{deleteError}</p>}
        </div>

        <div className="card">
          <h3>Top 5 blueprints por cantidad de puntos</h3>
          {status.authors === 'unsupported' && <p>No disponible con este backend.</p>}
          {status.authors === 'failed' && error.authors && (
            <div className="error-banner">
              <span>Error al cargar el catálogo: {error.authors}</span>
              <button className="btn" onClick={retryFetchAuthors}>
                Reintentar
              </button>
            </div>
          )}
          {status.authors === 'succeeded' && !topBlueprints.length && (
            <p>Aún no hay datos suficientes.</p>
          )}
          {status.authors === 'succeeded' && !!topBlueprints.length && (
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
        {isAuthenticated && current && (
          <p className={dirty ? 'unsaved-badge' : 'saved-badge'}>
            {dirty ? 'Cambios sin guardar' : 'Sin cambios pendientes'}
          </p>
        )}
        {saveError && <p className="error-text">{saveError}</p>}
        <div className="form-field">
          <BlueprintCanvas
            id="canvas-blueprint"
            points={draftPoints}
            width={520}
            height={360}
            editable={isAuthenticated && !!current}
            onAddPoint={handleAddPoint}
          />
        </div>
        {isAuthenticated && current && (
          <div className="canvas-actions">
            <button
              className="btn primary"
              onClick={handleSaveChanges}
              disabled={!dirty || status.update === 'loading'}
            >
              {status.update === 'loading' ? 'Guardando...' : 'Guardar'}
            </button>
            <button className="btn" onClick={handleUndoPoint} disabled={!draftPoints.length}>
              Deshacer último punto
            </button>
            <button className="btn" onClick={handleDiscardChanges} disabled={!dirty}>
              Descartar cambios
            </button>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!confirmTarget}
        title="Eliminar blueprint"
        message={
          confirmTarget
            ? `¿Eliminar "${confirmTarget.name}" de ${confirmTarget.author}? Esta acción no se puede deshacer.`
            : ''
        }
        onConfirm={confirmDeleteBlueprint}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  )
}
