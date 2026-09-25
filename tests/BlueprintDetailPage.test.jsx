import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore, createSlice } from '@reduxjs/toolkit'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import BlueprintDetailPage from '../src/pages/BlueprintDetailPage.jsx'

vi.mock('../src/features/blueprints/blueprintsSlice.js', () => ({
  fetchBlueprint: (payload) => ({ type: 'blueprints/fetchBlueprint', payload }),
}))

function makeStore(current) {
  const slice = createSlice({
    name: 'blueprints',
    initialState: {
      current,
      status: { current: 'succeeded' },
      error: { current: null },
    },
    reducers: {},
  })
  return configureStore({ reducer: { blueprints: slice.reducer } })
}

function renderAt(current) {
  const store = makeStore(current)
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/blueprints/jdoe/house']}>
        <Routes>
          <Route path="/blueprints/:author/:name" element={<BlueprintDetailPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('BlueprintDetailPage', () => {
  it('usa BlueprintCanvas (un <canvas>) en vez de un <svg> para dibujar el plano', () => {
    const { container } = renderAt({
      author: 'jdoe',
      name: 'house',
      points: [
        { x: 10, y: 10 },
        { x: 40, y: 60 },
      ],
    })

    expect(screen.getByText('house')).toBeInTheDocument()
    expect(container.querySelector('canvas')).toBeInTheDocument()
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })
})
