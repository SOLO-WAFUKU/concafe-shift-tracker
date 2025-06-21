/**
 * ローディングスピナーコンポーネント
 * 読み込み中状態を表示するアニメーション
 */

import React from 'react'
import { Box, Spinner, Text, VStack } from '@chakra-ui/react'

interface LoadingSpinnerProps {
  /** ローディングメッセージ */
  message?: string
  /** サイズ */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** カラー */
  color?: string
  /** 全画面表示かどうか */
  fullScreen?: boolean
}

/**
 * ローディングスピナーコンポーネント
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = '読み込み中...',
  size = 'md',
  color = 'pink.500',
  fullScreen = false
}) => {
  const content = (
    <VStack spacing={4}>
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color={color}
        size={size}
      />
      {message && (
        <Text
          fontSize="sm"
          color="gray.600"
          textAlign="center"
        >
          {message}
        </Text>
      )}
    </VStack>
  )

  if (fullScreen) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        width="100vw"
        height="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="rgba(255, 255, 255, 0.9)"
        zIndex={9999}
      >
        {content}
      </Box>
    )
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={8}
    >
      {content}
    </Box>
  )
}

/**
 * インラインローディングスピナー
 */
export const InlineLoadingSpinner: React.FC<{
  size?: 'xs' | 'sm' | 'md'
  color?: string
}> = ({ size = 'sm', color = 'pink.500' }) => {
  return (
    <Spinner
      thickness="2px"
      speed="0.65s"
      emptyColor="gray.200"
      color={color}
      size={size}
      display="inline-block"
      mr={2}
    />
  )
}

/**
 * コンテンツローディング用スケルトン
 */
export const ContentSkeleton: React.FC<{
  lines?: number
  height?: string
}> = ({ lines = 3, height = '20px' }) => {
  return (
    <VStack spacing={3} align="stretch">
      {Array.from({ length: lines }).map((_, index) => (
        <Box
          key={index}
          height={height}
          bg="gray.200"
          borderRadius="md"
          animation="pulse 2s infinite"
        />
      ))}
    </VStack>
  )
}

export default LoadingSpinner