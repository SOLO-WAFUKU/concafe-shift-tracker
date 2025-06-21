/**
 * 画像生成ユーティリティ
 * 動的な画像生成とフォールバック処理
 */

/**
 * 女の子の名前に基づいて一意の色を生成
 */
const generateColorFromName = (name: string): string => {
  const colors = [
    '#ff69b4', // ホットピンク
    '#ff1493', // ディープピンク
    '#9370db', // 紫
    '#00bfff', // 青
    '#ffa500', // オレンジ
    '#87ceeb', // 水色
    '#ff6347', // トマト色
    '#32cd32', // 緑
    '#dda0dd', // プラム
    '#f0e68c', // カーキ
    '#ff7f50', // コーラル
    '#98fb98'  // 薄緑
  ]
  
  // 名前から一意のインデックスを生成
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) & 0xffffffff
  }
  
  return colors[Math.abs(hash) % colors.length]
}

/**
 * 時間帯に基づいて背景グラデーションを生成
 */
const getTimeGradient = (time?: string): string => {
  if (!time) return '#ff69b4'
  
  const hour = parseInt(time.split(':')[0])
  
  if (hour >= 6 && hour < 12) {
    // 朝: 明るい色
    return `linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)`
  } else if (hour >= 12 && hour < 17) {
    // 午後: 温かい色
    return `linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)`
  } else {
    // 夜間: 深い色
    return `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
  }
}

/**
 * 動的にSVG画像を生成する関数
 */
export const generateDynamicAvatar = (
  name: string,
  time?: string,
  status?: 'active' | 'new' | 'left'
): string => {
  const baseColor = generateColorFromName(name)
  const gradient = getTimeGradient(time)
  
  // ステータスに基づいてボーダー色を決定
  const borderColor = status === 'new' ? '#00ff00' : status === 'left' ? '#gray' : '#ffffff'
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${baseColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${shadeColor(baseColor, -20)};stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- 背景 -->
      <rect width="400" height="500" fill="url(#bg)"/>
      
      <!-- デコレーション円 -->
      <circle cx="200" cy="150" r="90" fill="${borderColor}" opacity="0.2"/>
      <circle cx="200" cy="150" r="70" fill="${borderColor}" opacity="0.4"/>
      <circle cx="200" cy="150" r="50" fill="${borderColor}" opacity="0.6"/>
      
      <!-- 名前テキスト -->
      <text x="200" y="350" text-anchor="middle" font-family="'Hiragino Sans', 'Yu Gothic', Arial, sans-serif" font-size="28" fill="white" font-weight="bold" stroke="rgba(0,0,0,0.3)" stroke-width="1">
        ${name}
      </text>
      
      <!-- 時間表示 -->
      ${time ? `
        <text x="200" y="380" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="white" opacity="0.9">
          ${time}から
        </text>
      ` : ''}
      
      <!-- ステータスインジケーター -->
      ${status === 'new' ? `
        <circle cx="350" cy="50" r="20" fill="#00ff00"/>
        <text x="350" y="55" text-anchor="middle" font-family="Arial" font-size="12" fill="white" font-weight="bold">NEW</text>
      ` : status === 'left' ? `
        <circle cx="350" cy="50" r="20" fill="#888888"/>
        <text x="350" y="55" text-anchor="middle" font-family="Arial" font-size="12" fill="white" font-weight="bold">卒業</text>
      ` : ''}
      
      <!-- 装飾パターン -->
      <g opacity="0.1">
        <path d="M50,450 Q200,400 350,450 Q200,500 50,450" fill="white"/>
        <circle cx="100" cy="100" r="15" fill="white"/>
        <circle cx="300" cy="120" r="12" fill="white"/>
        <circle cx="80" cy="200" r="8" fill="white"/>
        <circle cx="320" cy="180" r="10" fill="white"/>
      </g>
    </svg>
  `
  
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

/**
 * 色を明るく/暗くする関数
 */
function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace("#", ""), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = (num >> 8 & 0x00FF) + amt
  const B = (num & 0x0000FF) + amt
  
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
}

/**
 * 外部画像の代替として使用する関数
 */
export const getImageUrl = (
  originalUrl?: string,
  fallbackName?: string,
  time?: string,
  status?: 'active' | 'new' | 'left'
): string => {
  // 元のURLが有効な場合はそれを使用
  if (originalUrl && !originalUrl.includes('placeholder') && !originalUrl.includes('picsum')) {
    return originalUrl
  }
  
  // フォールバック: 動的SVGを生成
  if (fallbackName) {
    return generateDynamicAvatar(fallbackName, time, status)
  }
  
  // 最終フォールバック
  return generateDynamicAvatar('？', time, status)
}

/**
 * 簡易的なプロフィール画像生成（アイコン用）
 */
export const generateSimpleAvatar = (name: string, size: number = 60): string => {
  const color = generateColorFromName(name)
  const initial = name.charAt(0)
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${color}"/>
      <text x="${size/2}" y="${size/2 + 8}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.4}" fill="white" font-weight="bold">
        ${initial}
      </text>
    </svg>
  `
  
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}