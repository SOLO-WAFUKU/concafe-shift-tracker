/**
 * 店舗フィルターコンポーネント
 * サイドバー形式の店舗選択フィルター
 */

import React from 'react'
import {
  VStack,
  Box,
  Text,
  Checkbox,
  CheckboxGroup,
  Divider,
  Badge,
  HStack,
  Button,
  Collapse,
  useDisclosure,
  Icon,
  Input,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react'
import { ChevronDownIcon, ChevronUpIcon, SearchIcon } from '@chakra-ui/icons'
import { useStores, useFilteredStores } from '@/hooks/useStores'
import type { Store } from '@/types/api'

interface StoreFilterProps {
  /** 選択中の店舗IDリスト */
  selectedStores: string[]
  /** 店舗選択変更時のコールバック */
  onStoreChange: (storeIds: string[]) => void
  /** コンパクトモード */
  compact?: boolean
}

/**
 * 店舗フィルターコンポーネント
 */
export const StoreFilter: React.FC<StoreFilterProps> = ({
  selectedStores,
  onStoreChange,
  compact = false
}) => {
  const { data: stores, isLoading } = useStores()
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: !compact })
  const [searchQuery, setSearchQuery] = React.useState('')

  // フィルタリングされた店舗リスト
  const filteredStores = useFilteredStores(stores, searchQuery)

  // 全選択/全解除
  const handleSelectAll = () => {
    if (filteredStores) {
      const allStoreIds = filteredStores.map(store => store.id)
      onStoreChange(allStoreIds)
    }
  }

  const handleSelectNone = () => {
    onStoreChange([])
  }

  // エリア別にグループ化
  const storesByArea = React.useMemo(() => {
    if (!filteredStores) return {}
    
    return filteredStores.reduce((acc, store) => {
      if (!acc[store.area]) {
        acc[store.area] = []
      }
      acc[store.area].push(store)
      return acc
    }, {} as Record<string, Store[]>)
  }, [filteredStores])

  if (isLoading) {
    return (
      <Box p={4}>
        <Text fontSize="sm" color="gray.500">
          店舗情報を読み込み中...
        </Text>
      </Box>
    )
  }

  const headerContent = (
    <HStack justify="space-between" w="full">
      <Text fontSize="lg" fontWeight="bold" color="gray.700">
        店舗フィルター
      </Text>
      {compact && (
        <Button size="xs" variant="ghost" onClick={onToggle}>
          <Icon as={isOpen ? ChevronUpIcon : ChevronDownIcon} />
        </Button>
      )}
    </HStack>
  )

  const filterContent = (
    <VStack spacing={4} align="stretch">
      {/* 検索ボックス */}
      <InputGroup size="sm">
        <InputLeftElement pointerEvents="none">
          <Icon as={SearchIcon} color="gray.400" />
        </InputLeftElement>
        <Input
          placeholder="店舗名で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          bg="white"
          borderColor="gray.200"
        />
      </InputGroup>

      {/* 操作ボタン */}
      <HStack spacing={2}>
        <Button 
          size="xs" 
          variant="outline" 
          colorScheme="pink"
          onClick={handleSelectAll}
        >
          全選択
        </Button>
        <Button 
          size="xs" 
          variant="outline" 
          onClick={handleSelectNone}
        >
          全解除
        </Button>
      </HStack>

      <Divider />

      {/* 店舗リスト */}
      <CheckboxGroup 
        value={selectedStores} 
        onChange={(values) => onStoreChange(values as string[])}
      >
        <VStack spacing={3} align="stretch">
          {Object.entries(storesByArea).map(([area, areaStores]) => (
            <Box key={area}>
              <Text 
                fontSize="sm" 
                fontWeight="semibold" 
                color="gray.600" 
                mb={2}
              >
                {area}
              </Text>
              <VStack spacing={2} align="stretch" pl={2}>
                {areaStores.map((store) => (
                  <StoreCheckboxItem
                    key={store.id}
                    store={store}
                    isCompact={compact}
                  />
                ))}
              </VStack>
            </Box>
          ))}
        </VStack>
      </CheckboxGroup>

      {filteredStores && filteredStores.length === 0 && (
        <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
          条件に一致する店舗がありません
        </Text>
      )}
    </VStack>
  )

  if (compact) {
    return (
      <Box bg="white" borderRadius="lg" shadow="sm" border="1px" borderColor="gray.200">
        <Box p={3} borderBottom="1px" borderColor="gray.100">
          {headerContent}
        </Box>
        <Collapse in={isOpen}>
          <Box p={3}>
            {filterContent}
          </Box>
        </Collapse>
      </Box>
    )
  }

  return (
    <Box 
      bg="white" 
      borderRadius="lg" 
      shadow="sm" 
      border="1px" 
      borderColor="gray.200"
      p={4}
      h="fit-content"
      position="sticky"
      top={4}
    >
      <Box mb={4}>
        {headerContent}
      </Box>
      {filterContent}
    </Box>
  )
}

/**
 * 店舗チェックボックスアイテム
 */
const StoreCheckboxItem: React.FC<{
  store: Store
  isCompact?: boolean
}> = ({ store, isCompact = false }) => {
  return (
    <Checkbox 
      value={store.id}
      colorScheme="pink"
      size={isCompact ? 'sm' : 'md'}
    >
      <HStack spacing={2} align="center">
        <Text 
          fontSize={isCompact ? 'xs' : 'sm'}
          fontWeight="medium"
          noOfLines={1}
        >
          {store.name}
        </Text>
        <Badge 
          colorScheme="pink" 
          variant="subtle" 
          fontSize="xs"
          borderRadius="full"
        >
          {store.girls_count}
        </Badge>
        {!store.is_active && (
          <Badge 
            colorScheme="gray" 
            variant="subtle" 
            fontSize="xs"
          >
            休業中
          </Badge>
        )}
      </HStack>
    </Checkbox>
  )
}

export default StoreFilter