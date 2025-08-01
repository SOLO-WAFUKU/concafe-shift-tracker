/**
 * デモページ - バックエンドなしでUIをテスト
 */

'use client'

import React from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  SimpleGrid,
  Card,
  CardBody,
  Button,
  Container,
  Heading,
  Image,
  useColorModeValue
} from '@chakra-ui/react'

const demoStores = [
  {
    id: "maidreamin-akiba",
    name: "めいどりーみん 秋葉原 本店",
    area: "秋葉原",
    girls_count: 12,
    url: "https://maidreamin.com/"
  },
  {
    id: "athome-akiba", 
    name: "あっとほぉーむカフェ",
    area: "秋葉原",
    girls_count: 8,
    url: "https://www.cafe-athome.com/"
  },
  {
    id: "cure-maid-akiba",
    name: "キュアメイドカフェ",
    area: "秋葉原", 
    girls_count: 15,
    url: "https://www.curemaid.jp/"
  },
  {
    id: "maidmade-akiba",
    name: "MAID MADE",
    area: "秋葉原",
    girls_count: 18,
    url: "https://made-maid.com/"
  },
  {
    id: "queens-court-akiba",
    name: "クイーンズコート",
    area: "秋葉原",
    girls_count: 20,
    url: "https://www.queenscourt.tv/"
  },
  {
    id: "lilian-prian-akiba",
    name: "リリアンプリアン",
    area: "秋葉原",
    girls_count: 14,
    url: "https://lilian-plian.com/"
  }
]

const demoGirls = [
  { id: 1, name: "まりる", status: "active", profileUrl: "https://maidreamin.com/cast/maid/detail.html?id=4", store: "めいどりーみん 秋葉原 本店" },
  { id: 2, name: "ちう", status: "new", profileUrl: "https://maidreamin.com/cast/maid/detail.html?id=545", store: "めいどりーみん 秋葉原 本店" },
  { id: 3, name: "みお", status: "active", profileUrl: "https://www.cafe-athome.com/", store: "あっとほぉーむカフェ" },
  { id: 4, name: "ゆき", status: "active", profileUrl: "https://www.cafe-athome.com/", store: "あっとほぉーむカフェ" },
  { id: 5, name: "さくら", status: "new", profileUrl: "https://www.curemaid.jp/", store: "キュアメイドカフェ" },
  { id: 6, name: "あいか", status: "active", profileUrl: "https://www.curemaid.jp/", store: "キュアメイドカフェ" },
  { id: 7, name: "みらい", status: "active", profileUrl: "https://made-maid.com/staff", store: "MAID MADE" },
  { id: 8, name: "ひなた", status: "new", profileUrl: "https://made-maid.com/staff", store: "MAID MADE" },
  { id: 9, name: "れいな", status: "active", profileUrl: "https://www.queenscourt.tv/maid", store: "クイーンズコート" },
  { id: 10, name: "かのん", status: "active", profileUrl: "https://www.queenscourt.tv/maid", store: "クイーンズコート" },
  { id: 11, name: "ゆめ", status: "new", profileUrl: "https://lilian-plian.com/", store: "リリアンプリアン" },
  { id: 12, name: "きらり", status: "active", profileUrl: "https://lilian-plian.com/", store: "リリアンプリアン" },
]

export default function DemoPage() {
  const bg = useColorModeValue('gray.50', 'gray.900')
  const cardBg = useColorModeValue('white', 'gray.800')
  
  // 店舗ごとにキャストをグループ化
  const girlsByStore = demoStores.map(store => ({
    ...store,
    girls: demoGirls.filter(girl => girl.store === store.name)
  }))

  return (
    <Box minH="100vh" bg={bg}>
      {/* ヘッダー */}
      <Box bg="white" shadow="sm" borderBottom="1px" borderColor="gray.200">
        <Container maxW="7xl">
          <HStack h={16} px={6} justify="space-between">
            <HStack spacing={3}>
              <Text
                fontSize="xl"
                fontWeight="bold"
                bgGradient="linear(to-r, pink.400, purple.500)"
                bgClip="text"
              >
                ConCafe Shift Tracker
              </Text>
              <Badge colorScheme="red" variant="solid" borderRadius="full">
                DEMO
              </Badge>
            </HStack>
            <Button 
              colorScheme="pink" 
              size="sm"
              as="a"
              href="https://github.com/SOLO-WAFUKU/concafe-shift-tracker"
              target="_blank"
              rel="noopener noreferrer"
            >
              管理者
            </Button>
          </HStack>
        </Container>
      </Box>

      <Container maxW="7xl" py={6}>
        <VStack spacing={6} align="stretch">
          {/* 日付タブ風 */}
          <HStack spacing={2} overflowX="auto">
            <Button colorScheme="pink" variant="solid" size="sm">今日(6/22)</Button>
            <Button variant="outline" size="sm">明日(6/23)</Button>
            <Button variant="outline" size="sm">6/24</Button>
            <Button variant="outline" size="sm">6/25</Button>
            <Button variant="outline" size="sm">6/26</Button>
          </HStack>

          {/* ステータス */}
          <HStack justify="space-between" wrap="wrap">
            <HStack spacing={4}>
              <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                今日の出勤
              </Text>
              <Badge colorScheme="pink" variant="subtle" fontSize="sm">
                {demoGirls.length}人出勤
              </Badge>
            </HStack>
          </HStack>

          {/* 店舗統計 */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {demoStores.map((store) => (
              <Card 
                key={store.id} 
                bg={cardBg}
                cursor="pointer"
                _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
                transition="all 0.2s"
                as="a"
                href={store.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <CardBody>
                  <VStack spacing={2}>
                    <Text fontSize="md" fontWeight="semibold">
                      {store.name}
                    </Text>
                    <Badge colorScheme="blue" variant="outline">
                      {store.girls_count}名在籍
                    </Badge>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          {/* 店舗別出勤嬢一覧 */}
          <VStack spacing={8} align="stretch">
            {girlsByStore.map((store) => (
              <Box key={store.id}>
                <Heading size="md" mb={4} color="gray.700">
                  {store.name} - 本日の出勤嬢 ({store.girls.length}名)
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
                  {store.girls.map((girl) => (
                <Card 
                  key={girl.id} 
                  bg={cardBg} 
                  overflow="hidden" 
                  position="relative" 
                  cursor="pointer" 
                  _hover={{ shadow: "lg", transform: "translateY(-2px)" }} 
                  transition="all 0.2s"
                  as="a"
                  href={girl.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {/* ステータスバッジ */}
                  {girl.status === 'new' && (
                    <Badge
                      position="absolute"
                      top={2}
                      right={2}
                      colorScheme="red"
                      variant="solid"
                      fontSize="xs"
                      borderRadius="full"
                      zIndex={2}
                    >
                      NEW
                    </Badge>
                  )}

                  {/* グラデーション背景 + 絵文字 */}
                  <Box
                    w="full"
                    h="200px"
                    bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    position="relative"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <VStack spacing={2}>
                      <Text fontSize="4xl" color="white">
                        👩‍💼
                      </Text>
                      <Text fontSize="lg" color="white" fontWeight="bold">
                        {girl.name}
                      </Text>
                    </VStack>
                    
                    <Box
                      position="absolute"
                      bottom={0}
                      left={0}
                      right={0}
                      h="50%"
                      bgGradient="linear(to-t, blackAlpha.600, transparent)"
                    />
                  </Box>

                  <CardBody>
                    <VStack spacing={2} align="stretch">
                      {/* 名前 */}
                      <Text fontSize="lg" fontWeight="bold" color="gray.800" textAlign="center">
                        {girl.name}
                      </Text>

                      {/* シフト情報 */}
                      <VStack spacing={1}>
                        <HStack spacing={2} justify="center">
                          <Text fontSize="sm" color="gray.700">
                            19:00 - 22:00
                          </Text>
                        </HStack>
                        <Badge colorScheme="purple" variant="subtle" fontSize="xs" borderRadius="full">
                          通常
                        </Badge>
                      </VStack>
                    </VStack>
                  </CardBody>
                </Card>
                  ))}
                </SimpleGrid>
              </Box>
            ))}
          </VStack>

          {/* 統計 */}
          <Card bg={cardBg}>
            <CardBody>
              <HStack spacing={6} justify="center" wrap="wrap">
                <VStack spacing={1}>
                  <Text fontSize="2xl" fontWeight="bold" color="pink.500">
                    {demoGirls.length}
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    本日出勤
                  </Text>
                </VStack>
                <VStack spacing={1}>
                  <Text fontSize="2xl" fontWeight="bold" color="gray.700">
                    {demoStores.reduce((sum, store) => sum + store.girls_count, 0)}
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    総在籍数
                  </Text>
                </VStack>
                <VStack spacing={1}>
                  <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                    {demoStores.length}
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    営業店舗
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>

          {/* デモ説明 */}
          <Card bg="blue.50" borderColor="blue.200">
            <CardBody>
              <VStack spacing={2} textAlign="center">
                <Text fontSize="sm" fontWeight="semibold" color="blue.700">
                  🎨 UI デモページ
                </Text>
                <Text fontSize="xs" color="blue.600">
                  これは ConCafe Shift Tracker のUIデモです。実際のデータはバックエンドAPIから取得されます。
                </Text>
                <HStack spacing={2} fontSize="xs">
                  <Text color="blue.600">✅ レスポンシブデザイン</Text>
                  <Text color="blue.600">✅ HotPepper風UI</Text>
                  <Text color="blue.600">✅ NEW嬢バッジ</Text>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  )
}