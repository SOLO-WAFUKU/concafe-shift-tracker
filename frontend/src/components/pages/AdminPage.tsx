/**
 * 管理者ページコンポーネント
 * Basic認証で保護された管理機能を提供
 */

import React, { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
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
  GridItem,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { SimpleLayout } from '@/components/templates/MainLayout'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { adminApi } from '@/lib/api'
import { formatDateJa } from '@/lib/utils'

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
  
  const toast = useToast()
  const queryClient = useQueryClient()

  // 認証処理
  const handleLogin = async () => {
    try {
      await adminApi.getStats(credentials)
      setIsAuthenticated(true)
      setAuthError('')
      toast({
        title: 'ログイン成功',
        status: 'success',
        duration: 3000
      })
    } catch (error) {
      setAuthError('認証に失敗しました。ユーザー名とパスワードを確認してください。')
    }
  }

  if (!isAuthenticated) {
    return (
      <SimpleLayout title="管理者ログイン">
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
                    placeholder="パスワード"
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
              </VStack>
            </CardBody>
          </Card>
        </Box>
      </SimpleLayout>
    )
  }

  return (
    <AdminDashboard credentials={credentials} />
  )
}

/**
 * 管理者ダッシュボード
 */
const AdminDashboard: React.FC<{
  credentials: { username: string; password: string }
}> = ({ credentials }) => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const { isOpen: isScrapeModalOpen, onOpen: onScrapeModalOpen, onClose: onScrapeModalClose } = useDisclosure()

  // データ取得
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats(credentials),
    refetchInterval: 30000 // 30秒ごとに更新
  })

  const { data: schedulerStatus, isLoading: schedulerLoading } = useQuery({
    queryKey: ['admin', 'scheduler'],
    queryFn: () => adminApi.getSchedulerStatus(credentials),
    refetchInterval: 10000 // 10秒ごとに更新
  })

  // 手動スクレイピング実行
  const manualScrapeMutation = useMutation({
    mutationFn: (storeIds?: string[]) => adminApi.manualScrape(credentials, storeIds),
    onSuccess: () => {
      toast({
        title: 'スクレイピング開始',
        description: 'スクレイピングを開始しました',
        status: 'success',
        duration: 5000
      })
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
    onError: (error: any) => {
      toast({
        title: 'スクレイピング失敗',
        description: error.message,
        status: 'error',
        duration: 5000
      })
    }
  })

  // キャッシュクリア
  const clearCacheMutation = useMutation({
    mutationFn: () => adminApi.clearCache(credentials),
    onSuccess: () => {
      toast({
        title: 'キャッシュクリア完了',
        status: 'success',
        duration: 3000
      })
    },
    onError: () => {
      toast({
        title: 'キャッシュクリア失敗',
        status: 'error',
        duration: 3000
      })
    }
  })

  if (statsLoading) {
    return (
      <SimpleLayout title="管理者ダッシュボード">
        <LoadingSpinner message="管理者情報を読み込み中..." />
      </SimpleLayout>
    )
  }

  if (statsError) {
    return (
      <SimpleLayout title="管理者ダッシュボード">
        <Alert status="error">
          <AlertIcon />
          管理者情報の取得に失敗しました
        </Alert>
      </SimpleLayout>
    )
  }

  return (
    <SimpleLayout title="管理者ダッシュボード">
      <VStack spacing={6} align="stretch">
        {/* 統計情報 */}
        <Card>
          <CardHeader>
            <Heading size="md">システム統計</Heading>
          </CardHeader>
          <CardBody>
            <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6}>
              <Stat>
                <StatLabel>総店舗数</StatLabel>
                <StatNumber>{stats?.total_stores || 0}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>総嬢数</StatLabel>
                <StatNumber>{stats?.total_girls || 0}</StatNumber>
                <StatHelpText>アクティブ: {stats?.active_girls || 0}</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>総シフト数</StatLabel>
                <StatNumber>{stats?.total_shifts || 0}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>本日新規</StatLabel>
                <StatNumber color="red.500">{stats?.new_girls_today || 0}</StatNumber>
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
            <HStack spacing={4} wrap="wrap">
              <Button
                colorScheme="pink"
                onClick={onScrapeModalOpen}
                isLoading={manualScrapeMutation.isPending}
              >
                手動スクレイピング実行
              </Button>
              <Button
                colorScheme="orange"
                variant="outline"
                onClick={() => clearCacheMutation.mutate()}
                isLoading={clearCacheMutation.isPending}
              >
                キャッシュクリア
              </Button>
            </HStack>
          </CardBody>
        </Card>

        {/* スケジューラー状況 */}
        <Card>
          <CardHeader>
            <Heading size="md">スケジューラー状況</Heading>
          </CardHeader>
          <CardBody>
            {schedulerLoading ? (
              <LoadingSpinner size="sm" />
            ) : schedulerStatus ? (
              <VStack align="stretch" spacing={3}>
                <HStack>
                  <Text fontWeight="semibold">状態:</Text>
                  <Badge 
                    colorScheme={schedulerStatus.scheduler_running ? 'green' : 'red'}
                    variant="solid"
                  >
                    {schedulerStatus.scheduler_running ? '実行中' : '停止中'}
                  </Badge>
                </HStack>
                
                {schedulerStatus.last_execution && (
                  <Box>
                    <Text fontWeight="semibold" mb={2}>最後の実行:</Text>
                    <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={4}>
                      <Box>
                        <Text fontSize="sm" color="gray.600">実行時刻</Text>
                        <Text fontSize="sm">
                          {formatDateJa(schedulerStatus.last_execution.executed_at)}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">成功/失敗</Text>
                        <Text fontSize="sm">
                          {schedulerStatus.last_execution.success_count} / {schedulerStatus.last_execution.failed_count}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">取得データ</Text>
                        <Text fontSize="sm">
                          嬢:{schedulerStatus.last_execution.total_girls} / シフト:{schedulerStatus.last_execution.total_shifts}
                        </Text>
                      </Box>
                    </Grid>
                  </Box>
                )}
              </VStack>
            ) : (
              <Text color="gray.500">スケジューラー情報を取得できませんでした</Text>
            )}
          </CardBody>
        </Card>

        {/* スクレイピング状況 */}
        <Card>
          <CardHeader>
            <Heading size="md">スクレイピング状況</Heading>
          </CardHeader>
          <CardBody>
            {stats?.scraping_status && stats.scraping_status.length > 0 ? (
              <TableContainer>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>店舗名</Th>
                      <Th>状態</Th>
                      <Th>最終実行</Th>
                      <Th>発見数</Th>
                      <Th>エラー</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {stats.scraping_status.map((status) => (
                      <Tr key={status.store_id}>
                        <Td>{status.store_name}</Td>
                        <Td>
                          <Badge
                            colorScheme={
                              status.status === 'success' ? 'green' :
                              status.status === 'failed' ? 'red' : 'yellow'
                            }
                            variant="subtle"
                          >
                            {status.status}
                          </Badge>
                        </Td>
                        <Td fontSize="xs">
                          {status.last_run ? formatDateJa(status.last_run) : '-'}
                        </Td>
                        <Td fontSize="sm">
                          嬢:{status.girls_found} / シフト:{status.shifts_found}
                        </Td>
                        <Td fontSize="xs" color="red.500" maxW="200px" noOfLines={1}>
                          {status.error_message || '-'}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            ) : (
              <Text color="gray.500">スクレイピング状況がありません</Text>
            )}
          </CardBody>
        </Card>

        {/* Cloudflare使用量 */}
        {stats?.cloudflare_usage && (
          <Card>
            <CardHeader>
              <Heading size="md">Cloudflare Images 使用量</Heading>
            </CardHeader>
            <CardBody>
              <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                <Box>
                  <Text fontSize="sm" color="gray.600">総画像数</Text>
                  <Text fontSize="lg" fontWeight="semibold">
                    {stats.cloudflare_usage.total_images}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">ストレージ使用量</Text>
                  <Text fontSize="lg" fontWeight="semibold">
                    {stats.cloudflare_usage.storage_used}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">帯域幅使用量</Text>
                  <Text fontSize="lg" fontWeight="semibold">
                    {stats.cloudflare_usage.bandwidth_used}
                  </Text>
                </Box>
              </Grid>
            </CardBody>
          </Card>
        )}
      </VStack>

      {/* 手動スクレイピングモーダル */}
      <Modal isOpen={isScrapeModalOpen} onClose={onScrapeModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>手動スクレイピング実行</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              全店舗のスクレイピングを手動で実行します。
              この処理には数分かかる場合があります。
            </Text>
            {manualScrapeMutation.isPending && (
              <Progress isIndeterminate colorScheme="pink" />
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onScrapeModalClose}>
              キャンセル
            </Button>
            <Button
              colorScheme="pink"
              onClick={() => {
                manualScrapeMutation.mutate()
                onScrapeModalClose()
              }}
              isLoading={manualScrapeMutation.isPending}
            >
              実行
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </SimpleLayout>
  )
}

export default AdminPage