import { version } from '../package.json'
import UIIcons from './sprites/svg/sprite.symbol.svg'
import noop from './noop'
import SVGHelper from './SVGHelper'

interface IStroeerVideoplayer {
  getUIEl: Function
  getRootEl: Function
  getVideoEl: Function
  loading: Function
  showBigPlayButton: Function
  enterFullscreen: Function
  exitFullscreen: Function
}

declare global {
  interface Document {
    mozCancelFullScreen?: () => Promise<void>
    msExitFullscreen?: () => void
    webkitExitFullscreen?: () => void
    mozFullScreenElement?: Element
    msFullscreenElement?: Element
    webkitFullscreenElement?: Element
  }

  interface HTMLElement {
    msRequestFullscreen?: () => Promise<void>
    mozRequestFullscreen?: () => Promise<void>
    webkitRequestFullscreen?: () => Promise<void>
  }
}

const isTouchDevice = (): boolean => {
  return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0))
}

const hideElement = (element: HTMLElement): void => {
  element.classList.add('hidden')
  element.setAttribute('aria-hidden', 'true')
}

const showElement = (element: HTMLElement): void => {
  element.classList.remove('hidden')
  element.removeAttribute('aria-hidden')
}

class UI {
  version: string
  uiName: string
  uiContainerClassName: string
  onDocumentFullscreenChange: Function
  onVideoElPlay: Function
  onVideoElPause: Function
  onLoadedMetaData: Function
  onVideoElTimeupdate: Function
  onVideoElVolumeChange: Function
  onDragStart: EventListener
  onDrag: EventListener
  onDragEnd: EventListener
  toggleControlBarInterval: ReturnType<typeof setInterval>
  toggleVolumeBarInterval: ReturnType<typeof setInterval>
  isMouseDown: Boolean

  constructor () {
    this.version = version
    this.uiName = 'ivad'
    this.uiContainerClassName = 'ivad'
    this.onDocumentFullscreenChange = noop
    this.onVideoElPlay = noop
    this.onVideoElPause = noop
    this.onVideoElTimeupdate = noop
    this.onVideoElVolumeChange = noop
    this.onLoadedMetaData = noop
    this.onDragStart = noop
    this.onDrag = noop
    this.onDragEnd = noop
    this.toggleControlBarInterval = setInterval(noop, 1000)
    this.toggleVolumeBarInterval = setInterval(noop, 1000)
    this.isMouseDown = false

    return this
  }

  // createButton Function:
  // creates a HTMLElement with given options, adds it to the buttonsContainer and returns it
  //   tag - the html tag to choose, mostly 'button'
  //   cls - the css class the tag gets
  //   aria - the aria label
  //   svgid - the id of the icon in the icon-svg
  //   ishidden - true to render hidden initially
  //   clickcb - a callback function called on 'click'

  createButton = (StroeerVideoplayer: IStroeerVideoplayer, tag: string, cls: string, aria: string, svgid: string, ishidden: boolean,
    evts: Array<{ name: string, callb: Function }>): HTMLElement => {
    const buttonsContainer = StroeerVideoplayer.getUIEl().querySelector('.buttons')
    const el = document.createElement(tag)
    el.classList.add(cls)
    el.setAttribute('aria-label', aria)
    el.appendChild(SVGHelper(svgid))

    if (ishidden) hideElement(el)
    for (let i = 0; i < evts.length; i++) {
      el.addEventListener(evts[i].name, (ev) => {
        evts[i].callb(ev)
      })
    }
    buttonsContainer.appendChild(el)
    return el
  }

  setTimeDisp = (timeDisp: HTMLElement, current: number, total: number): void => {
    const secondsLeft = Math.floor(total - current)
    let secondsLeftString = String(secondsLeft)
    if (isNaN(secondsLeft)) {
      secondsLeftString = '∞'
    }
    timeDisp.innerHTML = 'Werbung endet in ' + secondsLeftString + ' Sekunden'
  }

  init = (StroeerVideoplayer: IStroeerVideoplayer): void => {
    const rootEl = StroeerVideoplayer.getRootEl()
    const videoEl = StroeerVideoplayer.getVideoEl()
    videoEl.removeAttribute('controls')
    const uiEl = StroeerVideoplayer.getUIEl()
    if (uiEl.children.length !== 0) {
      return
    }

    if (document.getElementById('stroeer-videoplayer-ivad-ui-icons') === null) {
      const uiIconsContainer = document.createElement('div')
      uiIconsContainer.id = 'stroeer-videoplayer-ivad-ui-icons'
      uiIconsContainer.innerHTML = UIIcons
      document.body.appendChild(uiIconsContainer)
    }

    const uiContainer = document.createElement('div')
    const loadingSpinnerContainer = document.createElement('div')
    const loadingSpinnerAnimation = document.createElement('div')
    const seekPreviewContainer = document.createElement('div')
    const seekPreview = document.createElement('div')
    const seekPreviewVideo = document.createElement('video')
    const seekPreviewTime = document.createElement('div')
    const seekPreviewTimeMinutes = document.createElement('span')
    const seekPreviewTimeDivider = document.createElement('span')
    const seekPreviewTimeSeconds = document.createElement('span')
    const volumeContainer = document.createElement('div')
    const volumeRange = document.createElement('div')
    const volumeLevel = document.createElement('div')
    const volumeLevelBubble = document.createElement('div')
    const controlBar = document.createElement('div')
    const buttonsContainer = document.createElement('div')
    const overlayContainer = document.createElement('div')
    seekPreviewVideo.setAttribute('preload', 'auto')
    seekPreviewContainer.classList.add('seek-preview-container')
    hideElement(seekPreviewContainer)
    seekPreview.classList.add('seek-preview')
    seekPreviewTime.classList.add('seek-preview-time')
    seekPreviewTimeMinutes.classList.add('seek-preview-time-minutes')
    seekPreviewTimeDivider.classList.add('seek-preview-time-divider')
    seekPreviewTimeDivider.innerHTML = ':'
    seekPreviewTimeSeconds.classList.add('seek-preview-time-seconds')
    seekPreviewTime.appendChild(seekPreviewTimeMinutes)
    seekPreviewTime.appendChild(seekPreviewTimeDivider)
    seekPreviewTime.appendChild(seekPreviewTimeSeconds)
    seekPreview.appendChild(seekPreviewVideo)
    seekPreview.appendChild(seekPreviewTime)
    seekPreviewContainer.appendChild(seekPreview)
    volumeContainer.className = 'volume-container'
    volumeContainer.style.opacity = '0'
    volumeRange.className = 'volume-range'
    volumeLevel.className = 'volume-level'
    volumeLevelBubble.className = 'volume-level-bubble'
    volumeRange.appendChild(volumeLevelBubble)
    volumeRange.appendChild(volumeLevel)
    volumeContainer.appendChild(volumeRange)
    overlayContainer.className = 'video-overlay'
    uiContainer.className = this.uiContainerClassName
    loadingSpinnerContainer.className = 'loading-spinner'
    hideElement(loadingSpinnerContainer)
    loadingSpinnerAnimation.className = 'animation'
    loadingSpinnerContainer.appendChild(loadingSpinnerAnimation)
    controlBar.className = 'controlbar'
    buttonsContainer.className = 'buttons'
    controlBar.appendChild(volumeContainer)
    controlBar.appendChild(buttonsContainer)
    uiContainer.appendChild(controlBar)
    uiContainer.appendChild(overlayContainer)
    uiContainer.appendChild(loadingSpinnerContainer)
    uiEl.appendChild(uiContainer);

    (function () {
      for (let i = 0; i < 12; i++) {
        const d = document.createElement('div')
        loadingSpinnerAnimation.appendChild(d)
      }
    })()

    if (isTouchDevice()) {
      const overlayTouchClickContainer = document.createElement('div')
      overlayTouchClickContainer.className = 'video-overlay-touchclick'
      overlayTouchClickContainer.innerHTML = 'Mehr Informationen'
      uiContainer.appendChild(overlayTouchClickContainer)
    }

    const showLoading = (modus: boolean): void => {
      if (modus) {
        showElement(loadingSpinnerContainer)
      } else {
        hideElement(loadingSpinnerContainer)
      }
    }

    StroeerVideoplayer.loading = (modus: boolean): void => {
      showLoading(modus)
    }

    videoEl.addEventListener('waiting', () => {
      showLoading(true)
    })

    videoEl.addEventListener('canplay', () => {
      showLoading(false)
    })

    videoEl.addEventListener('playing', () => {
      showLoading(false)
    })

    // Create the Buttons
    const playButton = this.createButton(StroeerVideoplayer, 'button', 'play', 'Play', 'Icon-Play', false,
      [{ name: 'click', callb: () => { videoEl.play() } }])

    if (videoEl.paused === false) {
      hideElement(playButton)
    }

    const pauseButton = this.createButton(StroeerVideoplayer, 'button', 'pause', 'Pause', 'Icon-Pause', videoEl.paused,
      [{ name: 'click', callb: () => { videoEl.pause() } }])

    const muteButton = this.createButton(StroeerVideoplayer, 'button', 'mute', 'Mute', 'Icon-Volume', videoEl.muted,
      [{ name: 'click', callb: () => { videoEl.muted = true } }])

    const unmuteButton = this.createButton(StroeerVideoplayer, 'button', 'unmute', 'Unmute', 'Icon-Mute', videoEl.muted !== true,
      [{ name: 'click', callb: () => { videoEl.muted = false } }])

    // Time Display
    const timeDisp = document.createElement('div')
    timeDisp.classList.add('time')
    controlBar.appendChild(timeDisp)

    StroeerVideoplayer.enterFullscreen = (): void => {
      if (typeof rootEl.requestFullscreen === 'function') {
        rootEl.requestFullscreen()
      } else if (typeof rootEl.webkitRequestFullscreen === 'function') {
        if (navigator.userAgent.includes('iPad')) {
          videoEl.webkitRequestFullscreen()
        } else {
          rootEl.webkitRequestFullscreen()
        }
      } else if (typeof rootEl.mozRequestFullScreen === 'function') {
        rootEl.mozRequestFullScreen()
      } else if (typeof rootEl.msRequestFullscreen === 'function') {
        rootEl.msRequestFullscreen()
      } else if (typeof rootEl.webkitEnterFullscreen === 'function') {
        rootEl.webkitEnterFullscreen()
      } else if (typeof videoEl.webkitEnterFullscreen === 'function') {
        videoEl.webkitEnterFullscreen()
      } else {
        console.log('Error trying to enter Fullscreen mode: No Request Fullscreen Function found')
      }
    }

    // Fullscreen Button
    const enterFullscreenButton = this.createButton(StroeerVideoplayer, 'button', 'enterFullscreen',
      'Enter Fullscreen', 'Icon-Fullscreen', false,
      [{
        name: 'click',
        callb: () => {
          StroeerVideoplayer.enterFullscreen()
        }
      }])

    StroeerVideoplayer.exitFullscreen = (): void => {
      if (typeof document.exitFullscreen === 'function') {
        document.exitFullscreen().then(noop).catch(noop)
      } else if (typeof document.webkitExitFullscreen === 'function') {
        document.webkitExitFullscreen()
      } else if (typeof document.mozCancelFullScreen === 'function') {
        document.mozCancelFullScreen().then(noop).catch(noop)
      } else if (typeof document.msExitFullscreen === 'function') {
        document.msExitFullscreen()
      } else if (typeof videoEl.webkitExitFullscreen === 'function') {
        videoEl.webkitExitFullscreen()
      } else {
        console.log('Error trying to enter Fullscreen mode: No Request Fullscreen Function found')
      }
    }

    const exitFullscreenButton = this.createButton(StroeerVideoplayer, 'button', 'exitFullscreen', 'Exit Fullscreen', 'Icon-FullscreenOff', true,
      [{
        name: 'click',
        callb: () => {
          StroeerVideoplayer.exitFullscreen()
        }
      }])

    seekPreviewVideo.src = videoEl.querySelector('source').src

    controlBar.appendChild(buttonsContainer)

    const controlBarContainer = document.createElement('div')
    controlBarContainer.classList.add('controlbar-container')

    controlBarContainer.appendChild(controlBar)
    uiContainer.appendChild(controlBarContainer)
    uiEl.appendChild(uiContainer)

    const toggleControlbarInSeconds = 5
    let toggleControlbarSecondsLeft = toggleControlbarInSeconds
    const toggleControlbarTicker = (): void => {
      if (videoEl.paused === true) {
        controlBarContainer.style.opacity = '1'
        toggleControlbarSecondsLeft = toggleControlbarInSeconds
        return
      }
      if (toggleControlbarSecondsLeft === 0) {
        controlBarContainer.style.opacity = '0'
      } else {
        toggleControlbarSecondsLeft = toggleControlbarSecondsLeft - 1
      }
    }

    rootEl.addEventListener('mousemove', () => {
      toggleControlbarSecondsLeft = toggleControlbarInSeconds
      controlBarContainer.style.opacity = '1'
    })

    clearInterval(this.toggleControlBarInterval)
    this.toggleControlBarInterval = setInterval(toggleControlbarTicker, 1000)

    const toggleVolumeSliderInSeconds = 2
    let toggleVolumeSliderSecondsLeft = toggleVolumeSliderInSeconds
    const toggleVolumeSliderTicker = (): void => {
      if (toggleVolumeSliderSecondsLeft === 0) {
        volumeContainer.style.opacity = '0'
      } else {
        toggleVolumeSliderSecondsLeft = toggleVolumeSliderSecondsLeft - 1
      }
    }

    volumeContainer.addEventListener('mousemove', () => {
      toggleVolumeSliderSecondsLeft = toggleVolumeSliderInSeconds
    })

    clearInterval(this.toggleVolumeBarInterval)
    this.toggleVolumeBarInterval = setInterval(toggleVolumeSliderTicker, 1000)

    this.onVideoElPlay = () => {
      hideElement(playButton)
      showElement(pauseButton)
    }
    videoEl.addEventListener('play', this.onVideoElPlay)

    this.onVideoElPause = () => {
      showElement(playButton)
      hideElement(pauseButton)
    }
    videoEl.addEventListener('pause', this.onVideoElPause)

    videoEl.addEventListener('loadedmetadata', () => {
      this.setTimeDisp(timeDisp, videoEl.currentTime, videoEl.duration)
    })

    if (videoEl.paused === true && videoEl.currentTime === 0) {
      videoEl.load()
    }

    this.onVideoElTimeupdate = () => {
      this.setTimeDisp(timeDisp, videoEl.currentTime, videoEl.duration)
    }
    videoEl.addEventListener('timeupdate', this.onVideoElTimeupdate)

    const calulateVolumePercentageBasedOnYCoords = (y: number): number => {
      const percentage = (100 / volumeRange.offsetHeight) * y
      return percentage
    }

    const updateVolumeWhileDragging = (evt: any): void => {
      let clientY = evt.clientY
      if (clientY === undefined) {
        if ('touches' in evt && evt.touches.length > 0) {
          clientY = evt.touches[0].clientY
        } else {
          clientY = false
        }
      }
      if (clientY === false) return
      const volumeRangeBoundingClientRect = volumeRange.getBoundingClientRect()
      let volumeContainerOffsetY = 0
      if ('x' in volumeRangeBoundingClientRect) {
        volumeContainerOffsetY = volumeRangeBoundingClientRect.y
      } else {
        volumeContainerOffsetY = volumeRangeBoundingClientRect.top
      }
      let y = clientY - volumeContainerOffsetY
      if (y < 0) y = 0
      if (y > volumeRangeBoundingClientRect.height) { y = volumeRangeBoundingClientRect.height }

      const percentageY = calulateVolumePercentageBasedOnYCoords(y)
      const percentageHeight = 100 - percentageY
      const percentageHeightString = String(percentageHeight)
      const percentageYString = String(percentageY)
      volumeLevel.style.height = percentageHeightString + '%'
      if (percentageY < 90) {
        volumeLevelBubble.style.top = percentageYString + '%'
      }
      const volume = percentageHeight / 100
      videoEl.volume = volume
    }

    let draggingWhat = ''

    this.onDragStart = (evt: any): void => {
      switch (evt.target) {
        case volumeRange:
        case volumeLevel:
        case volumeLevelBubble:
          draggingWhat = 'volume'
          break
        default:
          break
      }
    }

    this.onDragEnd = (evt: any): void => {
      if (draggingWhat === 'volume') {
        draggingWhat = ''
        updateVolumeWhileDragging(evt)
      }
    }

    this.onDrag = (evt: any): void => {
      if (draggingWhat === 'volume') {
        updateVolumeWhileDragging(evt)
      }
    }

    document.body.addEventListener('touchstart', this.onDragStart, {
      passive: true
    })
    document.body.addEventListener('touchend', this.onDragEnd, {
      passive: true
    })
    document.body.addEventListener('touchmove', this.onDrag, {
      passive: true
    })
    document.body.addEventListener('mousedown', this.onDragStart, {
      passive: true
    })
    document.body.addEventListener('mouseup', this.onDragEnd, {
      passive: true
    })
    document.body.addEventListener('mousemove', this.onDrag, {
      passive: true
    })

    this.onVideoElVolumeChange = () => {
      if (videoEl.muted === true) {
        hideElement(muteButton)
        showElement(unmuteButton)
      } else {
        showElement(muteButton)
        hideElement(unmuteButton)
      }
    }
    videoEl.addEventListener('volumechange', this.onVideoElVolumeChange)

    muteButton.addEventListener('mouseover', () => {
      if (isTouchDevice()) {
        return
      }
      volumeContainer.style.opacity = '1'
      toggleVolumeSliderSecondsLeft = toggleVolumeSliderInSeconds
    })

    unmuteButton.addEventListener('mouseover', () => {
      if (isTouchDevice()) {
        return
      }
      volumeContainer.style.opacity = '1'
      toggleVolumeSliderSecondsLeft = toggleVolumeSliderInSeconds
    })

    this.onDocumentFullscreenChange = () => {
      if (document.fullscreenElement === rootEl) {
        hideElement(enterFullscreenButton)
        showElement(exitFullscreenButton)
      } else {
        showElement(enterFullscreenButton)
        hideElement(exitFullscreenButton)
      }
    }

    // @ts-expect-error
    document.addEventListener('fullscreenchange', this.onDocumentFullscreenChange)

    // iOS Workarounds
    videoEl.addEventListener('webkitendfullscreen', function () {
    // @ts-expect-error
      document.fullscreenElement = null
      showElement(enterFullscreenButton)
      hideElement(exitFullscreenButton)
    })
    document.addEventListener('webkitfullscreenchange', function () {
      if (document.webkitFullscreenElement !== null) {
        showElement(exitFullscreenButton)
        hideElement(enterFullscreenButton)
      } else {
        showElement(enterFullscreenButton)
        hideElement(exitFullscreenButton)
      }
    })

    // IE11 workaround
    document.addEventListener('MSFullscreenChange', function () {
      if (document.msFullscreenElement !== null) {
        showElement(exitFullscreenButton)
        hideElement(enterFullscreenButton)
      } else {
        hideElement(exitFullscreenButton)
        showElement(enterFullscreenButton)
      }
    })
  }

  deinit = (StroeerVideoplayer: IStroeerVideoplayer): void => {
    const videoEl = StroeerVideoplayer.getVideoEl()
    videoEl.setAttribute('controls', '')
    const uiEl = StroeerVideoplayer.getUIEl()
    const uiContainer = uiEl.firstChild
    if (uiContainer !== undefined && uiContainer.className === this.uiContainerClassName) {
      videoEl.removeEventListener('play', this.onVideoElPlay)
      videoEl.removeEventListener('pause', this.onVideoElPause)
      videoEl.removeEventListener('timeupdate', this.onVideoElTimeupdate)
      videoEl.removeEventListener('volumechange', this.onVideoElVolumeChange)
      document.body.removeEventListener('touchstart', this.onDragStart)
      document.body.removeEventListener('touchend', this.onDragEnd)
      document.body.removeEventListener('touchmove', this.onDrag)
      document.body.removeEventListener('mousedown', this.onDragStart)
      document.body.removeEventListener('mouseup', this.onDragEnd)
      document.body.removeEventListener('mousemove', this.onDrag)
      clearInterval(this.toggleControlBarInterval)
      clearInterval(this.toggleVolumeBarInterval)
      // @ts-expect-error
      document.removeEventListener('fullscreenchange', this.onDocumentFullscreenChange)
      uiEl.removeChild(uiEl.firstChild)
    }
  }
}

const StroeerVideoplayerIvadUI = new UI()

export default StroeerVideoplayerIvadUI
