const { generatePoem, polishPoem: apiPolishPoem, analyzePoem: apiAnalyzePoem } = require('../../utils/api.js')
const config = require('../../utils/config.js')

Page({
  data: {
    inputText: '',
    isAcrostic: false,
    selectedType: '绝句',
    selectedStyle: '',
    selectedEmotion: '',
    isGenerating: false,
    poemData: null,
    historyList: [],
    hotTags: ['#孤独', '#中秋', '#思乡', '#表白', '#离别', '#山水', '#明月', '#春日'],
    poemTypes: ['绝句', '律诗', '词', '古风'],
    styles: ['李白', '杜甫', '李清照', '苏轼', '王维', '陶渊明'],
    emotions: ['悲伤', '喜悦', '闲适', '豪迈', '思念', '哲理'],
    quickPolishOptions: ['换个写法', '更优美一些', '更有气势', '更含蓄', '第三句改一下'],
    polishInput: '',
    analysis: ''
  },

  onLoad() {
    this.loadHistory()
  },

  onInput(e) {
    this.setData({
      inputText: e.detail.value
    })
  },

  selectHotTag(e) {
    const tag = e.currentTarget.dataset.tag.replace('#', '')
    this.setData({
      inputText: tag
    })
  },

  toggleAcrostic() {
    this.setData({
      isAcrostic: !this.data.isAcrostic
    })
  },

  selectType(e) {
    this.setData({
      selectedType: e.currentTarget.dataset.type
    })
  },

  selectStyle(e) {
    const style = e.currentTarget.dataset.style
    this.setData({
      selectedStyle: this.data.selectedStyle === style ? '' : style
    })
  },

  selectEmotion(e) {
    const emotion = e.currentTarget.dataset.emotion
    this.setData({
      selectedEmotion: this.data.selectedEmotion === emotion ? '' : emotion
    })
  },

  async generatePoem() {
    const { inputText, selectedType, isAcrostic, selectedStyle, selectedEmotion } = this.data
    
    if (!inputText.trim()) {
      wx.showToast({ title: '请输入主题', icon: 'none' })
      return
    }

    this.setData({
      isGenerating: true,
      poemData: null
    })

    try {
      const options = {
        theme: inputText.trim(),
        type: selectedType,
        isAcrostic: isAcrostic,
        style: selectedStyle,
        emotion: selectedEmotion
      }
      
      const poem = await generatePoem(options)
      
      this.setData({
        poemData: poem,
        isGenerating: false
      })

      this.saveToHistory(poem)
      wx.showToast({ title: '创作完成', icon: 'success' })
    } catch (error) {
      this.setData({ isGenerating: false })
      console.error('生成失败:', error)
      wx.showModal({
        title: '创作失败',
        content: error.message || 'API调用失败，请检查网络和API配置',
        showCancel: false
      })
    }
  },

  analyzePoem() {
    const { poemData, analysis } = this.data
    
    if (!poemData) return
    
    if (analysis) {
      this.setData({ analysis: '' })
      return
    }

    this.setData({ isGenerating: true })

    apiAnalyzePoem(poemData)
      .then((result) => {
        this.setData({
          analysis: result,
          isGenerating: false
        })
      })
      .catch((error) => {
        this.setData({ isGenerating: false })
        console.error('鉴赏失败:', error)
        wx.showToast({ title: '鉴赏失败', icon: 'none' })
      })
  },

  closeAnalysis() {
    this.setData({ analysis: '' })
  },

  copyPoem() {
    const { poemData } = this.data
    
    if (!poemData) return

    const poemText = `${poemData.title}\n\n${poemData.content.join('\n')}\n\n—— AI创作`
    
    wx.setClipboardData({
      data: poemText,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
      fail: () => wx.showToast({ title: '复制失败', icon: 'none' })
    })
  },

  onPolishInput(e) {
    this.setData({
      polishInput: e.detail.value
    })
  },

  quickPolish(e) {
    const option = e.currentTarget.dataset.option
    this.setData({
      polishInput: option
    })
    this.polishPoem()
  },

  async polishPoem() {
    const { poemData, polishInput } = this.data
    
    if (!poemData || !polishInput.trim()) {
      wx.showToast({ title: '请输入修改建议', icon: 'none' })
      return
    }

    this.setData({ isGenerating: true })

    try {
      const updatedPoem = await apiPolishPoem(poemData, polishInput.trim())
      
      this.setData({
        poemData: updatedPoem,
        polishInput: '',
        isGenerating: false
      })
      
      wx.showToast({ title: '修改完成', icon: 'success' })
    } catch (error) {
      this.setData({ isGenerating: false })
      console.error('修改失败:', error)
      wx.showModal({
        title: '修改失败',
        content: error.message || 'API调用失败，请检查网络和API配置',
        showCancel: false
      })
    }
  },

  loadHistory() {
    try {
      const history = wx.getStorageSync('poem_history')
      if (history) {
        this.setData({ historyList: JSON.parse(history) })
      }
    } catch (error) {
      console.error('加载历史失败:', error)
    }
  },

  saveToHistory(poem) {
    try {
      let history = this.data.historyList
      history.unshift(poem)
      if (history.length > 20) history = history.slice(0, 20)
      this.setData({ historyList: history })
      wx.setStorageSync('poem_history', JSON.stringify(history))
    } catch (error) {
      console.error('保存历史失败:', error)
    }
  },

  showHistoryPoem(e) {
    const index = e.currentTarget.dataset.index
    const poem = this.data.historyList[index]
    this.setData({
      poemData: poem,
      inputText: poem.theme,
      selectedType: poem.type,
      selectedStyle: poem.style || '',
      selectedEmotion: poem.emotion || ''
    })
  },

  clearHistory() {
    wx.showModal({
      title: '提示',
      content: '确定清空历史记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ historyList: [] })
          wx.removeStorageSync('poem_history')
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  }
})