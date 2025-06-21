import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get('url')
  
  if (!imageUrl) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  try {
    // 外部画像を取得
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const imageBuffer = await response.arrayBuffer()

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 24時間キャッシュ
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    console.error('Image proxy error:', error)
    
    // フォールバック画像を返す
    const fallbackImageUrl = `https://via.placeholder.com/400x500/ff69b4/ffffff?text=${encodeURIComponent('画像読み込みエラー')}`
    
    try {
      const fallbackResponse = await fetch(fallbackImageUrl)
      const fallbackBuffer = await fallbackResponse.arrayBuffer()
      
      return new NextResponse(fallbackBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600'
        }
      })
    } catch {
      return new NextResponse('Image not found', { status: 404 })
    }
  }
}