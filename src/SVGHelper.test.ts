import SVGHelper from './SVGHelper'

it('icon should not be undefined', () => {
  const icon = SVGHelper('play')
  expect(icon).not.toBe(undefined)
})

it('icon should not be undefined', () => {
  const icon = SVGHelper('play', {
    useAttributes: [
      ['class', 'hidden']
    ]
  })
  expect(icon).not.toBe(undefined)
})
