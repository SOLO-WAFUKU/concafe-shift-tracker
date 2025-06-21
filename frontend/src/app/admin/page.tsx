/**
 * 管理者ページ (簡易版)
 */

'use client'

import React from 'react'
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Alert,
  AlertIcon,
  Button
} from '@chakra-ui/react'

export default function AdminPage() {
  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="4xl" py={8}>
        <VStack spacing={6}>
          <Heading>管理者ページ</Heading>
          
          <Alert status="info">
            <AlertIcon />
            この管理者ページはデモ版です。完全版はバックエンドAPIと連携します。
          </Alert>
          
          <Text textAlign="center" color="gray.600">
            バックエンドAPIデプロイ後に管理機能が利用可能になります。
          </Text>
          
          <Button 
            colorScheme="pink" 
            onClick={() => window.location.href = '/demo'}
          >
            デモページに戻る
          </Button>
        </VStack>
      </Container>
    </Box>
  )
}