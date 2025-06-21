import React from 'react'
import {
  Box,
  Text,
  VStack,
  HStack,
  Badge
} from '@chakra-ui/react'
import { Clock } from 'lucide-react'
import type { Shift } from '@/types/api'

interface GirlCardProps {
  girl: {
    id: number
    name: string
    image_url?: string
    status: 'active' | 'new' | 'left'
  }
  shift?: Shift
  storeName?: string
  clickable?: boolean
  compact?: boolean
  onClick?: () => void
}

export const GirlCard: React.FC<GirlCardProps> = ({
  girl,
  shift,
  storeName,
  clickable = true,
  compact = false,
  onClick
}) => {
  const statusColor = girl.status === 'new' ? 'blue' : girl.status === 'left' ? 'gray' : 'green'
  const statusLabel = girl.status === 'new' ? '新人' : girl.status === 'left' ? '卒業' : '在籍中'

  return (
    <Box
      bg="white"
      borderRadius="lg"
      shadow="md"
      overflow="hidden"
      cursor={clickable ? "pointer" : "default"}
      onClick={onClick}
      transition="all 0.2s"
      _hover={clickable ? {
        shadow: "lg",
        transform: "translateY(-2px)"
      } : {}}
      position="relative"
      w="full"
      maxW={compact ? "200px" : "280px"}
    >
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

      {/* 背景色での画像代替 */}
      <Box
        w="full"
        h={compact ? "160px" : "200px"}
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

      <VStack spacing={2} p={compact ? 3 : 4} align="stretch">
        <Text
          fontSize={compact ? "md" : "lg"}
          fontWeight="bold"
          color="gray.800"
          textAlign="center"
          noOfLines={1}
        >
          {girl.name}
        </Text>

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

        {shift && (
          <VStack spacing={1}>
            <HStack spacing={2} justify="center">
              <Clock size={12} color="gray" />
              <Text fontSize={compact ? "xs" : "sm"} color="gray.700">
                {shift.start_time} - {shift.end_time}
              </Text>
            </HStack>
            
            <Badge
              colorScheme="purple"
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
        )}
      </VStack>
    </Box>
  )
}

export const SimpleGirlCard: React.FC<{
  girl: {
    name: string
    image_url?: string
    status: 'active' | 'new' | 'left'
  }
  storeName?: string
}> = ({ girl, storeName }) => {
  const statusColor = girl.status === 'new' ? 'blue' : girl.status === 'left' ? 'gray' : 'green'
  const statusLabel = girl.status === 'new' ? '新人' : girl.status === 'left' ? '卒業' : '在籍中'

  return (
    <HStack spacing={3} p={3} bg="white" borderRadius="md" shadow="sm">
      <Box 
        w="40px" 
        h="50px" 
        bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        borderRadius="sm"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="white" fontSize="lg">👩‍💼</Text>
      </Box>
      <VStack align="start" spacing={1} flex={1}>
        <HStack>
          <Text fontSize="sm" fontWeight="medium">
            {girl.name}
          </Text>
          <Badge
            colorScheme={statusColor}
            variant="solid"
            fontSize="xs"
          >
            {statusLabel}
          </Badge>
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