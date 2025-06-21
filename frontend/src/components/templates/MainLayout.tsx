/**
 * メインレイアウトコンポーネント
 * アプリケーション全体の共通レイアウトを提供
 */

import React from 'react'
import {
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  IconButton,
  Link,
  Spacer,
  Text,
  useColorMode,
  useDisclosure,
  VStack,
  Badge,
  Button,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useBreakpointValue
} from '@chakra-ui/react'
import { Menu, Moon, Sun, Settings, Search } from 'lucide-react'
import { useNewGirlsToday } from '@/hooks/useGirls'
import { useRouter } from 'next/navigation'

interface MainLayoutProps {
  children: React.ReactNode
  /** ページタイトル */
  title?: string
  /** サイドバーコンテンツ */
  sidebar?: React.ReactNode
  /** ヘッダーに追加するアクション */
  headerActions?: React.ReactNode
}

/**
 * メインレイアウトコンポーネント
 */
export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  sidebar,
  headerActions
}) => {
  const { colorMode, toggleColorMode } = useColorMode()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const router = useRouter()
  
  // レスポンシブ対応
  const isMobile = useBreakpointValue({ base: true, lg: false }) ?? true
  const containerMaxW = useBreakpointValue({ base: 'full', xl: '7xl' }) ?? 'full'

  return (
    <Box minH="100vh" bg="gray.50">
      {/* ヘッダー */}
      <Header
        title={title}
        onMenuClick={onOpen}
        onColorModeToggle={toggleColorMode}
        colorMode={colorMode}
        headerActions={headerActions}
        showMenuButton={Boolean(isMobile && sidebar)}
      />

      <Container maxW={containerMaxW} px={{ base: 4, md: 6 }}>
        <Flex gap={6} py={6}>
          {/* サイドバー（デスクトップ） */}
          {sidebar && !isMobile && (
            <Box
              w="300px"
              flexShrink={0}
            >
              {sidebar}
            </Box>
          )}

          {/* メインコンテンツ */}
          <Box flex={1}>
            {children}
          </Box>
        </Flex>
      </Container>

      {/* サイドバー（モバイル：ドロワー） */}
      {sidebar && isMobile && (
        <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="sm">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>フィルター</DrawerHeader>
            <DrawerBody>
              {sidebar}
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      )}

      {/* フッター */}
      <Footer />
    </Box>
  )
}

/**
 * ヘッダーコンポーネント
 */
const Header: React.FC<{
  title?: string
  onMenuClick: () => void
  onColorModeToggle: () => void
  colorMode: string
  headerActions?: React.ReactNode
  showMenuButton: boolean
}> = ({ 
  title, 
  onMenuClick, 
  onColorModeToggle, 
  colorMode, 
  headerActions,
  showMenuButton 
}) => {
  const { data: newGirls } = useNewGirlsToday()
  const router = useRouter()

  return (
    <Box bg="white" shadow="sm" borderBottom="1px" borderColor="gray.200">
      <Container maxW="7xl">
        <Flex h={16} alignItems="center" px={{ base: 4, md: 6 }}>
          {/* モバイルメニューボタン */}
          {showMenuButton && (
            <IconButton
              size="md"
              icon={<Menu size={18} />}
              aria-label="メニューを開く"
              onClick={onMenuClick}
              mr={4}
            />
          )}

          {/* ロゴ・タイトル */}
          <Link
            href="/"
            onClick={(e) => {
              e.preventDefault()
              router.push('/')
            }}
            _hover={{ textDecoration: 'none' }}
          >
            <HStack spacing={3}>
              <Text
                fontSize="xl"
                fontWeight="bold"
                bgGradient="linear(to-r, pink.400, purple.500)"
                bgClip="text"
              >
                ConCafe Shift
              </Text>
              {newGirls && newGirls.length > 0 && (
                <Badge
                  colorScheme="red"
                  variant="solid"
                  borderRadius="full"
                  fontSize="xs"
                >
                  NEW {newGirls.length}
                </Badge>
              )}
            </HStack>
          </Link>

          {/* ページタイトル */}
          {title && (
            <>
              <Text mx={4} color="gray.300">|</Text>
              <Heading size="md" color="gray.700">
                {title}
              </Heading>
            </>
          )}

          <Spacer />

          {/* ヘッダーアクション */}
          <HStack spacing={2}>
            {headerActions}
            
            {/* 管理者ページリンク */}
            <IconButton
              size="sm"
              variant="ghost"
              icon={<Settings size={16} />}
              aria-label="管理者ページ"
              onClick={() => router.push('/admin')}
            />

            {/* ダークモード切替 */}
            <IconButton
              size="sm"
              variant="ghost"
              icon={colorMode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              aria-label="ダークモード切替"
              onClick={onColorModeToggle}
            />
          </HStack>
        </Flex>
      </Container>
    </Box>
  )
}

/**
 * フッターコンポーネント
 */
const Footer: React.FC = () => {
  return (
    <Box bg="gray.800" color="white" py={8} mt={12}>
      <Container maxW="7xl">
        <VStack spacing={4}>
          <Text fontSize="sm" textAlign="center">
            © 2024 ConCafe Shift Tracker. All rights reserved.
          </Text>
          <HStack spacing={6} fontSize="sm">
            <Link href="/privacy" color="gray.300" _hover={{ color: 'white' }}>
              プライバシーポリシー
            </Link>
            <Link href="/terms" color="gray.300" _hover={{ color: 'white' }}>
              利用規約
            </Link>
            <Link href="/contact" color="gray.300" _hover={{ color: 'white' }}>
              お問い合わせ
            </Link>
          </HStack>
          <Text fontSize="xs" color="gray.400" textAlign="center">
            このサイトは個人が運営する非公式サービスです。
            <br />
            各店舗の公式情報は直接店舗にお問い合わせください。
          </Text>
        </VStack>
      </Container>
    </Box>
  )
}

/**
 * シンプルレイアウト（管理者ページ等用）
 */
export const SimpleLayout: React.FC<{
  children: React.ReactNode
  title?: string
}> = ({ children, title }) => {
  return (
    <Box minH="100vh" bg="gray.50">
      <Box bg="white" shadow="sm" borderBottom="1px" borderColor="gray.200">
        <Container maxW="7xl">
          <Flex h={16} alignItems="center" px={{ base: 4, md: 6 }}>
            <Heading size="md" color="gray.700">
              {title || 'ConCafe Shift Tracker'}
            </Heading>
          </Flex>
        </Container>
      </Box>
      
      <Container maxW="7xl" py={6}>
        {children}
      </Container>
    </Box>
  )
}

export default MainLayout