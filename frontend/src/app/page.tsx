/**
 * メインページ
 * デモページにリダイレクト
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()
  
  useEffect(() => {
    // デモページにリダイレクト
    router.push('/demo')
  }, [router])

  return null
}