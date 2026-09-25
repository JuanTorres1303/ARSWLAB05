import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BlueprintForm from '../src/components/BlueprintForm.jsx'

describe('BlueprintForm', () => {
  it('envía el formulario con puntos parseados', () => {
    const onSubmit = vi.fn()
    render(<BlueprintForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/Autor/i), { target: { value: 'john' } })
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'house' } })
    fireEvent.change(screen.getByLabelText(/Puntos/i), {
      target: { value: '[{"x":1,"y":2}]' },
    })
    fireEvent.submit(screen.getByText(/Guardar/i))

    expect(onSubmit).toHaveBeenCalledWith({
      author: 'john',
      name: 'house',
      points: [{ x: 1, y: 2 }],
    })
  })

  it('no envía el formulario si autor y nombre están vacíos', () => {
    const onSubmit = vi.fn()
    render(<BlueprintForm onSubmit={onSubmit} />)

    fireEvent.submit(screen.getByText(/Guardar/i))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText(/El autor es obligatorio/i)).toBeInTheDocument()
    expect(screen.getByText(/El nombre es obligatorio/i)).toBeInTheDocument()
  })

  it('no envía el formulario si el JSON de puntos es inválido', () => {
    const onSubmit = vi.fn()
    render(<BlueprintForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/Autor/i), { target: { value: 'john' } })
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'house' } })
    fireEvent.change(screen.getByLabelText(/Puntos/i), { target: { value: 'no es json' } })
    fireEvent.submit(screen.getByText(/Guardar/i))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText(/El JSON de puntos no es válido/i)).toBeInTheDocument()
  })

  it('no envía el formulario si el JSON de puntos no es un arreglo', () => {
    const onSubmit = vi.fn()
    render(<BlueprintForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/Autor/i), { target: { value: 'john' } })
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'house' } })
    fireEvent.change(screen.getByLabelText(/Puntos/i), { target: { value: '{"x":1,"y":2}' } })
    fireEvent.submit(screen.getByText(/Guardar/i))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText(/El JSON de puntos no es válido/i)).toBeInTheDocument()
  })
})
