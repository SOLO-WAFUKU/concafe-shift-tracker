/**
 * 嬢カードコンポーネント
 * 嬢の写真、名前、シフト情報を表示するカード
 */

import React from 'react'
import {
  Box,
  Image,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Divider,
  Grid,
  GridItem,
  Icon,
  Tooltip
} from '@chakra-ui/react'
import { Clock, Calendar, Star } from 'lucide-react'
// Local utility functions (replaced @/lib/utils)
const optimizeImageUrl = (url?: string, width?: number) => {
  if (!url) return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face'
  // In a real app, this would optimize the image URL
  return url
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'green'
    case 'new': return 'blue'
    case 'left': return 'gray'
    default: return 'gray'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return '在籍中'
    case 'new': return '新人'
    case 'left': return '卒業'
    default: return status
  }
}

const formatTime = (time: string) => {
  // Format time string (e.g., "14:30" -> "14:30")
  return time || ''
}

const getTimeSlotColor = (timeSlot: string) => {
  switch (timeSlot) {
    case '午前': return 'yellow'
    case '午後': return 'orange'
    case '夜間': return 'purple'
    default: return 'gray'
  }
}

const getTimeSlot = (time: string) => {
  if (!time) return '不明'
  const hour = parseInt(time.split(':')[0])
  if (hour < 12) return '午前'
  if (hour < 17) return '午後'
  return '夜間'
}
// Mock hook for demo purposes (replaced useGirlDetail)
const useGirlDetail = (girlId: number) => {
  return {
    data: {
      id: girlId,
      name: 'デモ嬢',
      image_url: '/images/placeholder-girl.jpg',
      status: 'active' as const,
      work_days_count: 15,
      favorite_time_slots: ['夜間', '午後'],
      recent_shifts: [
        { id: 1, date: '2024-01-15', start_time: '18:00', end_time: '22:00' },
        { id: 2, date: '2024-01-14', start_time: '19:00', end_time: '23:00' }
      ]
    },
    isLoading: false
  }
}
import type { Shift } from '@/types/api'

interface GirlCardProps {
  /** 嬢の基本情報 */
  girl: {
    id: number
    name: string
    image_url?: string
    status: 'active' | 'new' | 'left'
  }
  /** シフト情報 */
  shift?: Shift
  /** 店舗名 */
  storeName?: string
  /** クリック可能かどうか */
  clickable?: boolean
  /** コンパクトモード */
  compact?: boolean
  /** カードクリック時のコールバック */
  onClick?: () => void
}

/**
 * 嬢カードコンポーネント
 */
export const GirlCard: React.FC<GirlCardProps> = ({
  girl,
  shift,
  storeName,
  clickable = true,
  compact = false,
  onClick
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const handleCardClick = () => {
    if (onClick) {
      onClick()
    } else if (clickable) {
      onOpen()
    }
  }

  const statusLabel = getStatusLabel(girl.status)
  const statusColor = getStatusColor(girl.status)

  return (
    <>
      <Box
        bg="white"
        borderRadius="lg"
        shadow="md"
        overflow="hidden"
        cursor={clickable ? "pointer" : "default"}
        onClick={handleCardClick}
        transition="all 0.2s"
        _hover={clickable ? {
          shadow: "lg",
          transform: "translateY(-2px)"
        } : {}}
        position="relative"
        w="full"
        maxW={compact ? "200px" : "280px"}
      >
        {/* ステータスバッジ */}
        {statusLabel && (
          <Badge
            position="absolute"
            top={2}
            right={2}
            colorScheme={statusColor}
            variant="solid"
            fontSize="xs"
            borderRadius="full"
            zIndex={2}
          >
            {statusLabel}
          </Badge>
        )}

        {/* 画像部分 */}
        <Box position="relative">
          <Image
            src={optimizeImageUrl(girl.image_url, compact ? 200 : 280)}
            alt={girl.name}
            w="full"
            h={compact ? "160px" : "200px"}
            objectFit="cover"
            fallbackSrc="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face"
            loading="lazy"
          />
          
          {/* グラデーション オーバーレイ */}
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            h="50%"
            bgGradient="linear(to-t, blackAlpha.600, transparent)"
          />
        </Box>

        {/* 情報部分 */}
        <VStack spacing={2} p={compact ? 3 : 4} align="stretch">
          {/* 名前 */}
          <Text
            fontSize={compact ? "md" : "lg"}
            fontWeight="bold"
            color="gray.800"
            textAlign="center"
            noOfLines={1}
          >
            {girl.name}
          </Text>

          {/* 店舗名 */}
          {storeName && (
            <Text
              fontSize="xs"
              color="gray.600"
              textAlign="center"
              noOfLines={1}
            >
              {storeName}
            </Text>
          )}

          {/* シフト情報 */}
          {shift && (
            <ShiftInfo shift={shift} compact={compact} />
          )}
        </VStack>
      </Box>

      {/* 詳細モーダル */}
      {clickable && (
        <GirlDetailModal
          girlId={girl.id}
          isOpen={isOpen}
          onClose={onClose}
        />
      )}
    </>
  )
}

/**
 * シフト情報表示コンポーネント
 */
const ShiftInfo: React.FC<{
  shift: Shift
  compact?: boolean
}> = ({ shift, compact = false }) => {
  const timeSlot = getTimeSlot(shift.start_time)
  const timeSlotColor = getTimeSlotColor(timeSlot)

  return (
    <VStack spacing={1}>
      <HStack spacing={2} justify="center">
        <Clock size={12} color="gray" />
        <Text fontSize={compact ? "xs" : "sm"} color="gray.700">
          {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
        </Text>
      </HStack>
      
      <Badge
        colorScheme={timeSlotColor}
        variant="subtle"
        fontSize="xs"
        borderRadius="full"
      >
        {shift.shift_type === 'special' ? '特別' : '通常'}
      </Badge>
      
      {shift.notes && (
        <Text fontSize="xs" color="gray.500" textAlign="center" noOfLines={1}>
          {shift.notes}
        </Text>
      )}
    </VStack>
  )
}

/**
 * 嬢詳細モーダル
 */
const GirlDetailModal: React.FC<{
  girlId: number
  isOpen: boolean
  onClose: () => void
}> = ({ girlId, isOpen, onClose }) => {
  const { data: girlDetail, isLoading } = useGirlDetail(girlId)

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {girlDetail?.name || '詳細情報'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {isLoading ? (
            <Text>読み込み中...</Text>
          ) : girlDetail ? (
            <VStack spacing={4} align="stretch">
              {/* 基本情報 */}
              <HStack spacing={4}>
                <Image
                  src={optimizeImageUrl(girlDetail.image_url, 150)}
                  alt={girlDetail.name}
                  w="100px"
                  h="120px"
                  objectFit="cover"
                  borderRadius="md"
                  fallbackSrc="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face"
                />
                <VStack align="start" spacing={2}>
                  <HStack>
                    <Text fontSize="lg" fontWeight="bold">
                      {girlDetail.name}
                    </Text>
                    <Badge
                      colorScheme={getStatusColor(girlDetail.status)}
                      variant="solid"
                    >
                      {getStatusLabel(girlDetail.status) || girlDetail.status}
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    勤務日数: {girlDetail.work_days_count}日
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    よく入る時間帯: {girlDetail.favorite_time_slots.join(', ')}
                  </Text>
                </VStack>
              </HStack>

              <Divider />

              {/* 最近のシフト履歴 */}
              <Box>
                <Text fontSize="md" fontWeight="semibold" mb={3}>
                  最近のシフト履歴
                </Text>
                {girlDetail.recent_shifts.length > 0 ? (
                  <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2}>
                    {girlDetail.recent_shifts.slice(0, 6).map((shift) => (
                      <GridItem key={shift.id}>
                        <Box
                          p={2}
                          bg="gray.50"
                          borderRadius="md"
                          fontSize="sm"
                        >
                          <HStack justify="space-between">
                            <Text fontWeight="medium">
                              {shift.date}
                            </Text>
                            <Text color="gray.600">
                              {formatTime(shift.start_time)}-{formatTime(shift.end_time)}
                            </Text>
                          </HStack>
                        </Box>
                      </GridItem>
                    ))}
                  </Grid>
                ) : (
                  <Text fontSize="sm" color="gray.500">
                    シフト履歴がありません
                  </Text>
                )}
              </Box>
            </VStack>
          ) : (
            <Text>情報を取得できませんでした</Text>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

/**
 * シンプル嬢カード（リスト表示用）
 */
export const SimpleGirlCard: React.FC<{
  girl: {
    name: string
    image_url?: string
    status: 'active' | 'new' | 'left'
  }
  storeName?: string
}> = ({ girl, storeName }) => {
  const statusLabel = getStatusLabel(girl.status)
  const statusColor = getStatusColor(girl.status)

  return (
    <HStack spacing={3} p={3} bg="white" borderRadius="md" shadow="sm">
      <Image
        src={optimizeImageUrl(girl.image_url, 60)}
        alt={girl.name}
        w="40px"
        h="50px"
        objectFit="cover"
        borderRadius="sm"
        fallbackSrc="/images/placeholder-girl.jpg"
      />
      <VStack align="start" spacing={1} flex={1}>
        <HStack>
          <Text fontSize="sm" fontWeight="medium">
            {girl.name}
          </Text>
          {statusLabel && (
            <Badge
              colorScheme={statusColor}
              variant="solid"
              fontSize="xs"
            >
              {statusLabel}
            </Badge>
          )}
        </HStack>
        {storeName && (
          <Text fontSize="xs" color="gray.600">
            {storeName}
          </Text>
        )}
      </VStack>
    </HStack>
  )
}

export default GirlCard