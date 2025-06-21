/**
 * 簡易管理者ページコンポーネント
 * デモ用の基本的な管理機能UI
 */

import React, { useState } from 'react'
import {
  Box,
  VStack,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Grid,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/react'

/**
 * 管理者ページコンポーネント
 */
export const AdminPage: React.FC = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authError, setAuthError] = useState('')

  // デモ用認証処理
  const handleLogin = () => {
    if (credentials.username === 'admin' && credentials.password === 'admin') {
      setIsAuthenticated(true)
      setAuthError('')
    } else {
      setAuthError('認証に失敗しました。ユーザー名とパスワードを確認してください。')
    }
  }

  if (!isAuthenticated) {
    return (
      <Box maxW="container.xl" mx="auto" p={6}>
        <Box maxW="400px" mx="auto" mt={12}>
          <Card>
            <CardHeader>
              <Heading size="md" textAlign="center">
                管理者認証
              </Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                {authError && (
                  <Alert status="error">
                    <AlertIcon />
                    {authError}
                  </Alert>
                )}
                
                <FormControl>
                  <FormLabel>ユーザー名</FormLabel>
                  <Input
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({
                      ...prev,
                      username: e.target.value
                    }))}
                    placeholder="admin"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>パスワード</FormLabel>
                  <Input
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({
                      ...prev,
                      password: e.target.value
                    }))}
                    placeholder="admin"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleLogin()
                      }
                    }}
                  />
                </FormControl>
                
                <Button
                  colorScheme="pink"
                  onClick={handleLogin}
                  isDisabled={!credentials.username || !credentials.password}
                  w="full"
                >
                  ログイン
                </Button>
                
                <Alert status="info" fontSize="sm">
                  <AlertIcon />
                  デモ用: admin / admin でログインできます
                </Alert>
              </VStack>
            </CardBody>
          </Card>
        </Box>
      </Box>
    )
  }

  return (
    <Box maxW="container.xl" mx="auto" p={6}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg" color="pink.500">
          管理者ダッシュボード
        </Heading>

        {/* システム統計 */}
        <Card>
          <CardHeader>
            <Heading size="md">システム統計</Heading>
          </CardHeader>
          <CardBody>
            <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6}>
              <Stat>
                <StatLabel>総店舗数</StatLabel>
                <StatNumber>3</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>総嬢数</StatLabel>
                <StatNumber>24</StatNumber>
                <StatHelpText>アクティブ: 18</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>総シフト数</StatLabel>
                <StatNumber>156</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>本日新規</StatLabel>
                <StatNumber color="red.500">2</StatNumber>
                <StatHelpText>NEW嬢</StatHelpText>
              </Stat>
            </Grid>
          </CardBody>
        </Card>

        {/* 操作パネル */}
        <Card>
          <CardHeader>
            <Heading size="md">システム操作</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                この管理画面はデモ版です。実際のバックエンドAPIが必要です。
              </Alert>
              
              <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                <Button colorScheme="pink" isDisabled>
                  手動スクレイピング実行
                </Button>
                <Button colorScheme="orange" variant="outline" isDisabled>
                  キャッシュクリア
                </Button>
                <Button colorScheme="blue" variant="outline" isDisabled>
                  データエクスポート
                </Button>
              </Grid>
            </VStack>
          </CardBody>
        </Card>

        {/* スケジューラー状況 */}
        <Card>
          <CardHeader>
            <Heading size="md">スケジューラー状況</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={3}>
              <Box>
                <Text fontWeight="semibold" mb={2}>現在の状態:</Text>
                <Badge colorScheme="yellow" variant="solid">
                  デモモード
                </Badge>
              </Box>
              
              <Text color="gray.500" fontSize="sm">
                バックエンドAPIが稼働していません。
                本格運用にはFastAPIサーバーが必要です。
              </Text>
            </VStack>
          </CardBody>
        </Card>

        {/* ログアウト */}
        <Card>
          <CardBody>
            <Button
              colorScheme="gray"
              variant="outline"
              onClick={() => setIsAuthenticated(false)}
            >
              ログアウト
            </Button>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  )
}

export default AdminPage