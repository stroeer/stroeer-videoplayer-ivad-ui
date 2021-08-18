import StroeerVideoplayerIvadUI from './UI'
import { version } from '../package.json'

const playStub = jest
  .spyOn(window.HTMLMediaElement.prototype, 'play')
  .mockImplementation(async () => { return await new Promise(() => {}) })

const pauseStub = jest
  .spyOn(window.HTMLMediaElement.prototype, 'pause')
  .mockImplementation(() => { })

Object.defineProperty(global.window.HTMLMediaElement.prototype, 'load', {
  configurable: true,
  // Define the property getter
  get () {
    return () => {}
  }
})

afterEach(() => {
  playStub.mockClear()
  pauseStub.mockClear()
})

const rootEl = document.createElement('div')
rootEl.classList.add('stroeer-videoplayer')
const uiEl = document.createElement('div')
uiEl.classList.add('stroeer-videoplayer-ui')
const videoEl = document.createElement('video')
videoEl.setAttribute('controls', '')
Object.defineProperty(videoEl, 'duration', { value: 10 })
const source1 = document.createElement('source')
source1.type = 'video/mp4'
source1.src = 'https://evilcdn.net/demo-videos/walialu-44s-testspot-longboarding-240p.mp4'
videoEl.appendChild(source1)
rootEl.appendChild(uiEl)
rootEl.appendChild(videoEl)
document.body.appendChild(rootEl)

class StroeerVideoplayer {
  constructor () {
    return this
  }

  static registerUI = (): boolean => {
    return true
  }

  getRootEl = (): HTMLDivElement => {
    return rootEl
  }

  getUIEl = (): HTMLDivElement => {
    return uiEl
  }

  getVideoEl = (): HTMLVideoElement => {
    return videoEl
  }

  loading = (): void => {
  }

  showBigPlayButton = (): void => {
  }

  enterFullscreen = (): void => {
  }

  exitFullscreen = (): void => {
  }
}

const svp = new StroeerVideoplayer()

StroeerVideoplayerIvadUI.init(svp)

it('should equal the version from package.json', () => {
  expect(StroeerVideoplayerIvadUI.version).toBe(version)
})

it('should exit early', () => {
  StroeerVideoplayerIvadUI.init(svp)
  expect(uiEl.querySelectorAll('.ivad').length).toBe(1)
})

it('should remove the controls from the video element', () => {
  expect(videoEl.getAttribute('controls')).toBe(null)
})

it('should append the ivad icons as svg to the document body', () => {
  expect(document.getElementById('stroeer-videoplayer-ivad-ui-icons')).not.toEqual(null)
})

it('should have an UI container', () => {
  expect(uiEl.querySelector('.ivad')).not.toEqual(null)
})

it('should have a controlbar container', () => {
  expect(uiEl.querySelector('.controlbar')).not.toEqual(null)
})

it('should have a buttons container', () => {
  expect(uiEl.querySelector('.buttons')).not.toEqual(null)
})

it('should have a play button in the buttons container', () => {
  expect(uiEl.querySelector('.buttons .play')).not.toEqual(null)
})

it('should have a pause button in the buttons container', () => {
  expect(uiEl.querySelector('.buttons .pause')).not.toEqual(null)
})

it('should have a mute button in the buttons container', () => {
  expect(uiEl.querySelector('.buttons .mute')).not.toEqual(null)
})

it('should have an unmute button in the buttons container', () => {
  expect(uiEl.querySelector('.buttons .unmute')).not.toEqual(null)
})

it('should have an enterFullscreen button in the buttons container', () => {
  expect(uiEl.querySelector('.buttons .enterFullscreen')).not.toEqual(null)
})

it('should have an exitFullscreen button in the buttons container', () => {
  expect(uiEl.querySelector('.buttons .exitFullscreen')).not.toEqual(null)
})

it('should trigger a play, when clicking on the play button', () => {
  const btn = uiEl.querySelector('.buttons .play') as HTMLButtonElement
  btn.click()
  expect(playStub).toHaveBeenCalled()
})

it('should trigger a pause, when clicking on the pause button', () => {
  const btn = uiEl.querySelector('.buttons .pause') as HTMLButtonElement
  btn.click()
  expect(pauseStub).toHaveBeenCalled()
})

it('should mute the video when clicked on the mute button', () => {
  const btn = uiEl.querySelector('.buttons .mute') as HTMLButtonElement
  btn.click()
  expect(videoEl.muted).toBe(true)
})

it('should unmute the video when clicked on the unmute button', () => {
  const btn = uiEl.querySelector('.buttons .unmute') as HTMLButtonElement
  btn.click()
  expect(videoEl.muted).toBe(false)
})

describe('accessibility (a11y)', () => {
  it('should contain a `aria-label` for all control buttons', () => {
    uiEl.querySelectorAll('.buttons button').forEach(button => {
      expect(button.getAttribute('aria-label')).not.toBe(null)
    })
  })

  it('should contain a `aria-hidden` attribute for all visually hidden elements', () => {
    uiEl.querySelectorAll('.hidden').forEach(element => {
      expect(element.getAttribute('aria-hidden')).toBe('true')
    })
  })
})
