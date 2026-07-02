const config = require('./config.js')

const MOCK_POEMS = {
  '绝句': [
    { title: '春日偶成', content: ['春风拂柳绿丝绦', '细雨润花红杏娇', '燕子归来寻旧垒', '牧童吹笛过溪桥'] },
    { title: '月夜思', content: ['明月高悬照九州', '清辉洒落满西楼', '遥知故乡今夜月', '应照离人望眼愁'] },
    { title: '江上行', content: ['江水滔滔向东流', '孤帆远影碧天悠', '两岸青山相对出', '一片白云天际浮'] }
  ],
  '律诗': [
    { title: '登高望远', content: ['万里晴空秋气高', '登高望远兴情豪', '群山叠翠连天际', '大海扬波涌碧涛', '雁阵南飞寻暖日', '枫林红透染霜袍', '人生得意须行乐', '莫使金樽空自劳'] },
    { title: '秋日抒怀', content: ['萧瑟秋风起塞北', '苍茫暮色笼江南', '长空雁叫霜晨月', '古寺钟声夜半岚', '落木萧萧辞旧岁', '寒江瑟瑟迎新蟾', '凭栏远眺思无限', '把酒临风意自酣'] }
  ],
  '词': [
    { title: '蝶恋花·春景', content: ['春景宜人花似锦', '蝶舞蜂飞', '处处闻啼鸟', '杨柳依依垂碧影', '桃花灼灼开新境', '细雨绵绵风细细', '春色无边', '醉了江南景', '梦里不知身是客', '醒来依旧诗情盛'] },
    { title: '清平乐·秋思', content: ['秋风萧瑟', '落叶飘如雪', '雁阵南飞声渐歇', '勾起乡愁万叠', '夕阳西下天边', '归帆远影如烟', '独倚栏杆望月', '何时共赏团圆'] }
  ],
  '古风': [
    { title: '行路难', content: ['君不见黄河之水天上来', '奔流到海不复回', '君不见高堂明镜悲白发', '朝如青丝暮成雪', '人生得意须尽欢', '莫使金樽空对月', '天生我材必有用', '千金散尽还复来'] },
    { title: '梦游天姥吟留别', content: ['海客谈瀛洲', '烟涛微茫信难求', '越人语天姥', '云霞明灭或可睹', '天姥连天向天横', '势拔五岳掩赤城', '天台四万八千丈', '对此欲倒东南倾'] }
  ]
}

function getMockPoem(theme, type) {
  const poems = MOCK_POEMS[type] || MOCK_POEMS['绝句']
  const randomIndex = Math.floor(Math.random() * poems.length)
  const basePoem = poems[randomIndex]
  return { title: basePoem.title, content: basePoem.content, theme: theme, type: type }
}

function buildPrompt(options) {
  const { theme, type, isAcrostic, style, emotion } = options
  
  let prompt = ''
  
  if (isAcrostic) {
    prompt = '请以「' + theme + '」四个字作为开头，创作一首藏头诗。'
  } else {
    const typeRules = {
      '绝句': '五言或七言绝句，共4句，每句字数相等，押韵工整',
      '律诗': '五言或七言律诗，共8句，对仗工整，押韵严格',
      '词': '按照词牌格式创作，如蝶恋花、清平乐、浣溪沙等',
      '古风': '古体诗风格，字数不限，自由奔放，富有意境'
    }
    prompt = '请根据主题「' + theme + '」创作一首' + type + '。' + typeRules[type]
  }
  
  if (style) {
    const styleDescriptions = {
      '李白': '豪放飘逸，想象奇特，气势磅礴',
      '杜甫': '沉郁顿挫，忧国忧民，格律严谨',
      '李清照': '婉约细腻，情感真挚，语言清丽',
      '苏轼': '旷达洒脱，意境开阔，豪放与婉约兼具',
      '王维': '清新自然，诗中有画，禅意浓厚',
      '陶渊明': '平淡自然，田园风格，质朴纯真'
    }
    prompt += '\n风格要求：模仿' + style + '的风格，' + styleDescriptions[style] + '。'
  }
  
  if (emotion) {
    const emotionDescriptions = {
      '悲伤': '情感基调悲伤凄凉',
      '喜悦': '情感基调欢快愉悦',
      '闲适': '情感基调悠闲自在',
      '豪迈': '情感基调豪迈奔放',
      '思念': '情感基调深情思念',
      '哲理': '情感基调深沉思考'
    }
    prompt += '\n情感基调：' + emotionDescriptions[emotion] + '。'
  }
  
  prompt += '\n\n要求：\n1. 标题要雅致，与主题相符\n2. 内容要有意境，用词优美\n3. 严格遵守格式规范\n4. 直接返回诗词内容，格式如下：\n标题：[诗词标题]\n内容：\n[第一句]\n[第二句]\n[第三句]\n[第四句]'
  
  return prompt
}

function parsePoemResponse(responseText) {
  try {
    const lines = responseText.trim().split('\n')
    let title = ''
    const content = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line || line.startsWith('---') || line.startsWith('===')) {
        continue
      }
      
      if (line.startsWith('标题：') || line.startsWith('【') || line.match(/^[《【]/)) {
        title = line.replace('标题：', '').replace(/[《》【】]/g, '').trim()
      } else if (line.match(/^[\u4e00-\u9fa5]{4,}/)) {
        content.push(line)
      }
    }
    
    if (!title && content.length > 0) {
      title = '无题'
    }
    
    return { title, content }
  } catch (error) {
    console.error('解析诗词响应失败:', error)
    return null
  }
}

function requestApi(prompt, customParams) {
  return new Promise(function(resolve, reject) {
    if (!config.QIANWEN_API_KEY || !config.QIANWEN_API_KEY.trim()) {
      reject(new Error('请先配置千问API Key'))
      return
    }
    
    var params = Object.assign({
      result_format: 'text',
      max_tokens: 300,
      temperature: 0.7,
      top_p: 0.9
    }, customParams)
    
    console.log('========== 开始API调用 ==========')
    console.log('API地址:', config.QIANWEN_API_URL)
    console.log('模型:', config.QIANWEN_MODEL)
    console.log('请求参数:', JSON.stringify({
      model: config.QIANWEN_MODEL,
      input: { prompt: prompt.substring(0, 50) + '...' },
      parameters: params
    }))
    
    wx.request({
      url: config.QIANWEN_API_URL,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + config.QIANWEN_API_KEY
      },
      data: {
        model: config.QIANWEN_MODEL,
        input: {
          prompt: prompt
        },
        parameters: params
      },
      success: function(res) {
        console.log('========== API响应 ==========')
        console.log('HTTP状态码:', res.statusCode)
        console.log('响应头:', JSON.stringify(res.header))
        console.log('完整响应数据:', JSON.stringify(res.data))
        
        if (res.statusCode === 200 && res.data && res.data.output && res.data.output.text) {
          console.log('API调用成功，响应文本:', res.data.output.text.substring(0, 100) + '...')
          resolve(res.data.output.text)
        } else if (res.data && res.data.message) {
          console.error('API返回错误:', res.data.message)
          reject(new Error(res.data.message))
        } else {
          console.error('API响应格式错误:', JSON.stringify(res.data))
          reject(new Error('API响应格式错误，请检查API Key和网络配置'))
        }
      },
      fail: function(error) {
        console.error('========== API请求失败 ==========')
        console.error('错误信息:', JSON.stringify(error))
        reject(new Error('网络请求失败，请检查网络连接或API配置'))
      },
      complete: function() {
        console.log('========== API调用结束 ==========')
      }
    })
  })
}

function generatePoem(options) {
  const prompt = buildPrompt(options)
  
  return new Promise(function(resolve, reject) {
    requestApi(prompt)
      .then(function(responseText) {
        console.log('生成诗词响应:', responseText)
        const parsed = parsePoemResponse(responseText)
        
        if (parsed && parsed.title && parsed.content.length > 0) {
          resolve({
            title: parsed.title,
            content: parsed.content,
            theme: options.theme,
            type: options.type,
            style: options.style,
            emotion: options.emotion
          })
        } else {
          console.error('解析诗词失败，原始响应:', responseText)
          reject(new Error('解析诗词失败，请检查API响应格式'))
        }
      })
      .catch(function(error) {
        console.warn('千问API调用失败，使用模拟数据:', error.message)
        resolve(getMockPoem(options.theme, options.type))
      })
  })
}

function polishPoem(originalPoem, feedback) {
  const poemText = originalPoem.title + '\n' + originalPoem.content.join('\n')
  const prompt = '这首诗是：\n' + poemText + '\n\n用户反馈：' + feedback + '\n\n请根据用户反馈修改这首诗，可以是整体重写或局部修改。保持诗词格式，直接返回修改后的内容。'
  
  console.log('========== 开始修改诗词 ==========')
  console.log('原诗词:', poemText)
  console.log('修改建议:', feedback)
  
  return new Promise(function(resolve, reject) {
    requestApi(prompt)
      .then(function(responseText) {
        console.log('修改诗词响应:', responseText)
        const parsed = parsePoemResponse(responseText)
        
        if (parsed && parsed.title && parsed.content.length > 0) {
          console.log('修改成功:', parsed.title)
          resolve({
            title: parsed.title,
            content: parsed.content,
            theme: originalPoem.theme,
            type: originalPoem.type
          })
        } else {
          console.error('修改失败，解析失败:', responseText)
          reject(new Error('修改失败，请检查API响应格式'))
        }
      })
      .catch(function(error) {
        console.error('修改API调用失败:', error.message)
        reject(error)
      })
  })
}

function analyzePoem(poem) {
  const poemText = poem.title + '\n' + poem.content.join('\n')
  const prompt = '请解析这首诗词：\n' + poemText + '\n\n请从以下几个方面进行解析：\n1. 诗词大意\n2. 意境赏析\n3. 修辞手法\n4. 情感表达\n\n用通俗易懂的语言，分点说明。'
  
  console.log('========== 开始解析诗词 ==========')
  console.log('待解析诗词:', poemText)
  
  return requestApi(prompt, { max_tokens: 3000 }).then(function(responseText) {
    console.log('解析响应:', responseText)
    return responseText
  }).catch(function(error) {
    console.error('解析API调用失败:', error.message)
    throw error
  })
}

module.exports = {
  generatePoem: generatePoem,
  polishPoem: polishPoem,
  analyzePoem: analyzePoem,
  config: config
};