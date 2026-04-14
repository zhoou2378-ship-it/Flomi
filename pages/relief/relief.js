// Flomi Relief Page — Bubble Pop Interaction
// Design: asymmetric floating bubbles, tap to pop with animation

// Bubble color palette — translucent, Material You inspired
const BUBBLE_COLORS = [
  'rgba(184, 192, 255, 0.30)',  // tertiary-fixed
  'rgba(255, 218, 217, 0.40)',  // secondary-fixed
  'rgba(218, 232, 190, 0.30)',  // primary-fixed
  'rgba(170, 178, 240, 0.22)',  // tertiary-fixed-dim
  'rgba(227, 227, 220, 0.55)',  // surface-container-highest
  'rgba(250, 200, 200, 0.50)',  // secondary-fixed-dim
  'rgba(218, 232, 190, 0.40)',  // primary-container
  'rgba(83, 91, 147, 0.10)',    // tertiary
]

// Predefined bubble layout (in rpx, screen ~750rpx wide, ~1334rpx tall)
// Asymmetric placement matching the design reference
const BUBBLE_LAYOUT = [
  { x: 60,  y: 280,  size: 180, delay: 0.0, floatDuration: 4.2 },
  { x: 460, y: 180,  size: 240, delay: 0.5, floatDuration: 5.1 },
  { x: 20,  y: 560,  size: 150, delay: 0.8, floatDuration: 3.8 },
  { x: 500, y: 520,  size: 300, delay: 0.2, floatDuration: 6.0 },
  { x: 260, y: 440,  size: 210, delay: 1.1, floatDuration: 4.7 },
  { x: 420, y: 760,  size: 120, delay: 0.6, floatDuration: 3.5 },
  { x: 540, y: 340,  size: 180, delay: 0.9, floatDuration: 4.9 },
  { x: 100, y: 740,  size: 270, delay: 0.3, floatDuration: 5.5 },
]

Page({
  data: {
    bubbles: [],
    poppedCount: 0,
    allPopped: false,
    showCelebration: false,
  },

  onLoad() {
    this.initBubbles()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  initBubbles() {
    const bubbles = BUBBLE_LAYOUT.map((layout, i) => ({
      id: i,
      x: layout.x,
      y: layout.y,
      size: layout.size,
      delay: layout.delay,
      floatDuration: layout.floatDuration,
      bg: BUBBLE_COLORS[i % BUBBLE_COLORS.length],
      popped: false,
      rippling: false,
    }))
    this.setData({ bubbles, poppedCount: 0, allPopped: false })
  },

  popBubble(e) {
    const id = e.currentTarget.dataset.id
    const bubbles = this.data.bubbles
    const bubble = bubbles[id]

    if (!bubble || bubble.popped) return

    // Haptic feedback
    wx.vibrateShort({ type: 'light' })

    // Trigger ripple briefly, then pop
    const rippleKey = `bubbles[${id}].rippling`
    const poppedKey = `bubbles[${id}].popped`

    this.setData({ [rippleKey]: true })

    setTimeout(() => {
      this.setData({
        [rippleKey]: false,
        [poppedKey]: true,
        poppedCount: this.data.poppedCount + 1,
      })

      // Check if all popped
      const allPopped = this.data.bubbles.every(b => b.popped)
      if (allPopped) {
        this.setData({ allPopped: true })
        // Auto-show celebration after a brief pause
        setTimeout(() => {
          this.setData({ showCelebration: true })
        }, 600)
      }
    }, 150)
  },

  onFeelBetter() {
    wx.vibrateShort({ type: 'medium' })
    this.setData({ showCelebration: true })
  },

  dismissCelebration() {
    this.setData({ showCelebration: false })
    // Respawn bubbles after a moment for continued use
    setTimeout(() => {
      this.initBubbles()
    }, 400)
  },
})
