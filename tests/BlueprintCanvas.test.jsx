import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import BlueprintCanvas from '../src/components/BlueprintCanvas.jsx'

describe('BlueprintCanvas', () => {
  it('renderiza un canvas y llama getContext', () => {
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
    const { container } = render(
      <BlueprintCanvas
        points={[
          { x: 10, y: 10 },
          { x: 50, y: 60 },
        ]}
      />,
    )
    expect(container.querySelector('canvas')).toBeInTheDocument()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('con editable=true, el clic llama a onAddPoint con coordenadas del canvas', () => {
    const rectSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({ left: 0, top: 0, width: 520, height: 360 })
    const onAddPoint = vi.fn()
    const { container } = render(
      <BlueprintCanvas points={[]} editable onAddPoint={onAddPoint} />,
    )
    const canvas = container.querySelector('canvas')

    fireEvent.click(canvas, { clientX: 100, clientY: 50 })

    expect(onAddPoint).toHaveBeenCalledWith({ x: 100, y: 50 })
    expect(canvas.className).toContain('canvas-editable')
    rectSpy.mockRestore()
  })

  it('escala el clic cuando el canvas se muestra más pequeño que sus dimensiones reales', () => {
    const rectSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({ left: 0, top: 0, width: 260, height: 180 })
    const onAddPoint = vi.fn()
    const { container } = render(
      <BlueprintCanvas points={[]} width={520} height={360} editable onAddPoint={onAddPoint} />,
    )
    const canvas = container.querySelector('canvas')

    fireEvent.click(canvas, { clientX: 130, clientY: 90 })

    expect(onAddPoint).toHaveBeenCalledWith({ x: 260, y: 180 })
    rectSpy.mockRestore()
  })

  it('sin editable, el clic no llama a onAddPoint', () => {
    const onAddPoint = vi.fn()
    const { container } = render(<BlueprintCanvas points={[]} onAddPoint={onAddPoint} />)
    const canvas = container.querySelector('canvas')

    fireEvent.click(canvas, { clientX: 10, clientY: 10 })

    expect(onAddPoint).not.toHaveBeenCalled()
    expect(canvas.className).not.toContain('canvas-editable')
  })
})
