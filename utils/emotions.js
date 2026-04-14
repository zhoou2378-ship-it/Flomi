/**
 * Flomi 情绪数据系统
 * 每种情绪包含：标签、颜色（气泡色）、方向（正/负）、关联词库
 */

const EMOTIONS = {
  // ===== 正向情绪 =====

  // 开心：黄色系 —— 阳光、活力、愉悦，跨文化最强正向情绪色
  happy: {
    label: '开心',
    emoji: '😊',
    direction: 'positive',
    energy: 90,
    bubbleColor: 'rgba(255, 228, 120, 0.50)',
    dotColor: 'rgba(230, 185, 40, 1)',
    borderColor: 'rgba(160, 120, 0, 0.12)',
    textColor: '#6b4a00',
    relatedWords: ['愉快', '满足', '轻松', '感恩', '期待', '活力', '温暖', '喜悦', '充实', '自在', '幸运', '平静'],
  },

  // 平静：青绿色系 —— 低唤醒正向，自然、安宁、冥想研究一致
  calm: {
    label: '平静',
    emoji: '🌿',
    direction: 'positive',
    energy: 75,
    bubbleColor: 'rgba(160, 220, 200, 0.45)',
    dotColor: 'rgba(60, 170, 145, 1)',
    borderColor: 'rgba(30, 110, 90, 0.12)',
    textColor: '#1a5c4a',
    relatedWords: ['安宁', '舒适', '放松', '清醒', '专注', '稳定', '从容', '淡然', '自在', '宁静', '踏实', '清晰'],
  },

  // 兴奋：橙色系 —— 高唤醒、热情、能量感，与开心黄色区分
  excited: {
    label: '兴奋',
    emoji: '✨',
    direction: 'positive',
    energy: 85,
    bubbleColor: 'rgba(255, 185, 100, 0.50)',
    dotColor: 'rgba(230, 130, 30, 1)',
    borderColor: 'rgba(160, 80, 0, 0.12)',
    textColor: '#7a3800',
    relatedWords: ['激动', '期待', '热情', '冲劲', '活跃', '跃跃欲试', '充满能量', '迫不及待', '振奋', '雀跃'],
  },

  // 感恩：玫瑰粉色系 —— 温柔、连结、被爱，社会情绪研究中的暖粉
  grateful: {
    label: '感恩',
    emoji: '🌸',
    direction: 'positive',
    energy: 80,
    bubbleColor: 'rgba(255, 195, 200, 0.48)',
    dotColor: 'rgba(220, 110, 125, 1)',
    borderColor: 'rgba(150, 50, 65, 0.12)',
    textColor: '#7a1a2a',
    relatedWords: ['珍惜', '温暖', '被爱', '幸福', '满足', '感动', '知足', '惦念', '牵挂', '感谢'],
  },

  // ===== 负向情绪 =====

  // 焦虑：黄绿色系 —— 警觉、不安、生理应激反应色（Kaya & Epps 研究）
  anxious: {
    label: '焦虑',
    emoji: '🌀',
    direction: 'negative',
    energy: 35,
    bubbleColor: 'rgba(195, 220, 140, 0.45)',
    dotColor: 'rgba(130, 170, 60, 1)',
    borderColor: 'rgba(80, 110, 20, 0.12)',
    textColor: '#3d5a00',
    sootheMain: '放轻松',
    sootheSub: '试试深呼吸～',
    relatedWords: ['担心', '紧张', '不安', '压力', '烦躁', '忐忑', '慌乱', '纠结', '迷茫', '无措', '心跳加速', '睡不着'],
  },

  // 难过：冷蓝色系 —— "feeling blue"跨文化共识，低唤醒负向
  sad: {
    label: '难过',
    emoji: '🌧',
    direction: 'negative',
    energy: 25,
    bubbleColor: 'rgba(160, 190, 235, 0.45)',
    dotColor: 'rgba(70, 120, 200, 1)',
    borderColor: 'rgba(30, 70, 140, 0.12)',
    textColor: '#1a3a7a',
    sootheMain: '抱抱你',
    sootheSub: '难过是可以哭的',
    relatedWords: ['失落', '委屈', '孤独', '想哭', '低落', '沉重', '无力', '心疼', '遗憾', '空洞', '被忽视', '疲惫'],
  },

  // 愤怒：深红色系 —— 最强跨文化共识，攻击性、危险、激活
  angry: {
    label: '愤怒',
    emoji: '🔥',
    direction: 'negative',
    energy: 20,
    bubbleColor: 'rgba(255, 155, 140, 0.48)',
    dotColor: 'rgba(210, 60, 45, 1)',
    borderColor: 'rgba(150, 20, 10, 0.12)',
    textColor: '#7a0a00',
    sootheMain: '发泄一下',
    sootheSub: '不要把气憋在心里',
    relatedWords: ['生气', '委屈', '不公平', '憋屈', '爆发', '抓狂', '烦透了', '受够了', '无语', '崩溃', '心寒', '失望'],
  },

  // 疲惫：暖灰褐色系 —— 低能量、沉闷、耗竭，去饱和的大地色
  tired: {
    label: '疲惫',
    emoji: '🍂',
    direction: 'negative',
    energy: 30,
    bubbleColor: 'rgba(200, 190, 175, 0.46)',
    dotColor: 'rgba(140, 125, 105, 1)',
    borderColor: 'rgba(90, 75, 55, 0.10)',
    textColor: '#4a3c28',
    sootheMain: '先停下来',
    sootheSub: '累了就歇一歇吧',
    relatedWords: ['累了', '没劲', '想休息', '撑不住', '倦怠', '空洞', '麻木', '提不起劲', '身心俱疲', '需要充电', '放空', '沉默'],
  },
}

// 所有情绪标签列表（用于首屏气泡）
const EMOTION_KEYS = Object.keys(EMOTIONS)

/**
 * 获取情绪信息
 */
function getEmotion(key) {
  return EMOTIONS[key] || null
}

/**
 * 获取所有情绪（用于首屏展示）
 */
function getAllEmotions() {
  return EMOTIONS
}

/**
 * 根据情绪key获取关联词（随机取 n 个）
 */
function getRelatedWords(emotionKey, count = 12) {
  const emotion = EMOTIONS[emotionKey]
  if (!emotion) return []
  const words = [...emotion.relatedWords]
  // shuffle
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]]
  }
  return words.slice(0, count)
}

/**
 * 判断情绪方向
 */
function isPositive(emotionKey) {
  return EMOTIONS[emotionKey]?.direction === 'positive'
}

module.exports = {
  EMOTIONS,
  EMOTION_KEYS,
  getEmotion,
  getAllEmotions,
  getRelatedWords,
  isPositive,
}
