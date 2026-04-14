Component({
  properties: {
    selected: {
      type: Number,
      value: 0
    }
  },
  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index
      const path = e.currentTarget.dataset.path
      if (index === this.properties.selected) return
      wx.switchTab({ url: path })
    }
  }
})
