/**
 * アプリケーションプロバイダー
 * Chakra UI、React Query、その他のプロバイダーを統合
 */

'use client'

import React from 'react'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { theme } from './theme'

// React Query クライアント設定
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // 404エラーの場合はリトライしない
        if (error?.response?.status === 404) {
          return false
        }
        // その他のエラーは最大2回リトライ
        return failureCount < 2
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5分間はキャッシュを利用
      gcTime: 10 * 60 * 1000, // 10分間キャッシュを保持
      refetchOnWindowFocus: false,
      refetchOnReconnect: true
    },
    mutations: {
      retry: 1,
      retryDelay: 1000
    }
  }
})

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ChakraProvider>
    </>
  )
}