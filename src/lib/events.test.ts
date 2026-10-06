import { describe, expect, it, vi } from 'vitest'
import { createEventChannel } from './events'

describe('createEventChannel', () => {
  it('entrega o payload a todos os inscritos, na ordem de inscrição', () => {
    const channel = createEventChannel<number>()
    const calls: string[] = []

    channel.subscribe((value) => calls.push(`a:${value}`))
    channel.subscribe((value) => calls.push(`b:${value}`))
    channel.emit(1)

    expect(calls).toEqual(['a:1', 'b:1'])
  })

  it('para de entregar depois que a inscrição é cancelada', () => {
    const channel = createEventChannel<string>()
    const listener = vi.fn()

    const unsubscribe = channel.subscribe(listener)
    channel.emit('antes')
    unsubscribe()
    channel.emit('depois')

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith('antes')
  })

  it('não pula inscritos quando um deles cancela a inscrição durante o emit', () => {
    const channel = createEventChannel<number>()
    const second = vi.fn()
    const unsubscribeFirst = channel.subscribe(() => {
      unsubscribeFirst()
    })
    channel.subscribe(second)

    channel.emit(1)
    channel.emit(2)

    expect(second).toHaveBeenCalledTimes(2)
  })

  it('só entrega a inscritos novos a partir do emit seguinte', () => {
    const channel = createEventChannel<number>()
    const late = vi.fn()
    channel.subscribe(() => {
      channel.subscribe(late)
    })

    channel.emit(1)
    expect(late).not.toHaveBeenCalled()

    channel.emit(2)
    expect(late).toHaveBeenCalledWith(2)
  })

  it('emite sem erro quando não há inscritos', () => {
    const channel = createEventChannel<void>()

    expect(() => {
      channel.emit()
    }).not.toThrow()
  })
})
