/**
 * ホームページコンポーネント
 * メインのシフト表示画面
 */

import React, { useState } from 'react'
import {
  Box,
  VStack,
  Grid,
  Text,
  HStack,
  Badge,
  Alert,
  AlertIcon,
  Button,
  useBreakpointValue,
  SimpleGrid,
  Flex,
  Spinner,
  InputGroup,
  InputLeftElement,
  Input
} from '@chakra-ui/react'
import { Search, RefreshCw } from 'lucide-react'

import { MainLayout } from '@/components/templates/MainLayout'
import { DateTabs } from '@/components/ui/DateTabs'
import { StoreFilter } from '@/components/ui/StoreFilter'
import { GirlCard } from '@/components/ui/GirlCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

import { useDayShifts } from '@/hooks/useShifts'
import { useStores } from '@/hooks/useStores'
import { generateDateRange, translateErrorMessage } from '@/lib/utils'
import type { FilterOptions } from '@/types/api'

/**
 * ホームページコンポーネント
 */
export const HomePage: React.FC = () => {
  // 状態管理
  const [selectedDate, setSelectedDate] = useState(() => 
    generateDateRange(1)[0] // 今日の日付
  )
  const [filters, setFilters] = useState<FilterOptions>({
    selectedStores: [],
    selectedDate,
    searchQuery: '',
    statusFilter: 'all'
  })

  // データ取得
  const { data: stores } = useStores()
  const { 
    data: dayShifts, 
    isLoading, 
    error, 
    refetch 
  } = useDayShifts(selectedDate)

  // レスポンシブ対応
  const gridColumns = useBreakpointValue({ 
    base: 1, 
    md: 2, 
    lg: 3, 
    xl: 4 
  })

  // 日付変更ハンドラー
  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    setFilters(prev => ({ ...prev, selectedDate: date }))
  }

  // フィルター変更ハンドラー
  const handleStoreFilterChange = (storeIds: string[]) => {
    setFilters(prev => ({ ...prev, selectedStores: storeIds }))
  }

  const handleSearchChange = (query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }))
  }

  // フィルタリングされたシフトデータ
  const filteredShifts = React.useMemo(() => {
    if (!dayShifts) return []

    let allShifts: Array<{
      shift: any
      storeName: string
    }> = []

    // 全店舗のシフトを統合
    dayShifts.stores.forEach(store => {
      store.shifts.forEach(shift => {
        allShifts.push({
          shift,
          storeName: store.store_name
        })
      })
    })

    // フィルタリング
    return allShifts.filter(({ shift, storeName }) => {
      // 店舗フィルター
      if (filters.selectedStores.length > 0 && 
          !filters.selectedStores.includes(shift.store_id)) {
        return false
      }

      // 検索クエリフィルター
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        return (
          shift.girl_name.toLowerCase().includes(query) ||
          storeName.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [dayShifts, filters])

  // サイドバーコンテンツ
  const sidebarContent = (
    <VStack spacing={4} align="stretch">
      <StoreFilter
        selectedStores={filters.selectedStores}
        onStoreChange={handleStoreFilterChange}
        compact={true}
      />
    </VStack>
  )

  // ヘッダーアクション
  const headerActions = (
    <HStack spacing={2}>
      <InputGroup size="sm" maxW="200px">
        <InputLeftElement pointerEvents="none">
          <Search size={16} />
        </InputLeftElement>
        <Input
          placeholder="嬢名で検索..."
          value={filters.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          bg="white"
        />
      </InputGroup>
      <Button
        size="sm"
        variant="outline"
        onClick={() => refetch()}
        isLoading={isLoading}
        leftIcon={<RefreshCw size={16} />}
      >
        更新
      </Button>
    </HStack>
  )

  return (
    <MainLayout
      title="シフト表"
      sidebar={sidebarContent}
      headerActions={headerActions}
    >
      <VStack spacing={6} align="stretch">
        {/* 日付タブ */}
        <Box>
          <DateTabs
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            days={7}
          />
        </Box>

        {/* ステータス表示 */}
        <HStack justify="space-between" wrap="wrap">
          <HStack spacing={4}>
            <Text fontSize="lg" fontWeight="semibold" color="gray.700">
              {new Date(selectedDate).toLocaleDateString('ja-JP', {
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </Text>
            {dayShifts && (
              <Badge colorScheme="pink" variant="subtle" fontSize="sm">
                {filteredShifts.length}人出勤
              </Badge>
            )}
          </HStack>
          
          {filters.selectedStores.length > 0 && (
            <Badge colorScheme="blue" variant="outline">
              {filters.selectedStores.length}店舗選択中
            </Badge>
          )}
        </HStack>

        {/* エラー表示 */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            {translateErrorMessage(error)}
          </Alert>
        )}

        {/* ローディング表示 */}
        {isLoading && (
          <LoadingSpinner message="シフト情報を読み込み中..." />
        )}

        {/* シフトカード表示 */}
        {!isLoading && !error && (
          <>
            {filteredShifts.length > 0 ? (
              <SimpleGrid
                columns={gridColumns}
                spacing={6}
                w="full"
              >
                {filteredShifts.map(({ shift, storeName }) => (
                  <GirlCard
                    key={`${shift.girl_id}-${shift.id}`}
                    girl={{
                      id: shift.girl_id,
                      name: shift.girl_name,
                      image_url: shift.girl_image_url,
                      status: 'active' // シフトに入っている場合はactive
                    }}
                    shift={shift}
                    storeName={storeName}
                    clickable={true}
                  />
                ))}
              </SimpleGrid>
            ) : (
              <EmptyState
                selectedDate={selectedDate}
                hasFilters={filters.selectedStores.length > 0 || !!filters.searchQuery}
                onClearFilters={() => {
                  setFilters(prev => ({
                    ...prev,
                    selectedStores: [],
                    searchQuery: ''
                  }))
                }}
              />
            )}
          </>
        )}

        {/* 統計情報 */}
        {dayShifts && !isLoading && (
          <StatsSection
            totalGirls={dayShifts.total_girls}
            storeCount={dayShifts.stores.length}
            filteredCount={filteredShifts.length}
          />
        )}
      </VStack>
    </MainLayout>
  )
}

/**
 * 空の状態表示コンポーネント
 */
const EmptyState: React.FC<{
  selectedDate: string
  hasFilters: boolean
  onClearFilters: () => void
}> = ({ selectedDate, hasFilters, onClearFilters }) => {
  const isToday = selectedDate === generateDateRange(1)[0]

  return (
    <Box
      textAlign="center"
      py={12}
      bg="white"
      borderRadius="lg"
      border="1px"
      borderColor="gray.200"
    >
      <VStack spacing={4}>
        <Text fontSize="xl" color="gray.600">
          😴
        </Text>
        <Text fontSize="lg" fontWeight="semibold" color="gray.700">
          {hasFilters ? 'フィルター条件に一致する出勤情報がありません' : 
           isToday ? '本日の出勤情報がありません' : 'この日の出勤情報がありません'}
        </Text>
        <Text fontSize="sm" color="gray.500">
          {hasFilters ? 'フィルター条件を変更してお試しください' : 
           '別の日付を選択するか、しばらく後に再度確認してください'}
        </Text>
        {hasFilters && (
          <Button
            colorScheme="pink"
            variant="outline"
            onClick={onClearFilters}
          >
            フィルターをクリア
          </Button>
        )}
      </VStack>
    </Box>
  )
}

/**
 * 統計情報セクション
 */
const StatsSection: React.FC<{
  totalGirls: number
  storeCount: number
  filteredCount: number
}> = ({ totalGirls, storeCount, filteredCount }) => {
  return (
    <Box
      bg="white"
      p={4}
      borderRadius="lg"
      border="1px"
      borderColor="gray.200"
    >
      <HStack spacing={6} justify="center" wrap="wrap">
        <VStack spacing={1}>
          <Text fontSize="2xl" fontWeight="bold" color="pink.500">
            {filteredCount}
          </Text>
          <Text fontSize="xs" color="gray.600">
            表示中
          </Text>
        </VStack>
        <VStack spacing={1}>
          <Text fontSize="2xl" fontWeight="bold" color="gray.700">
            {totalGirls}
          </Text>
          <Text fontSize="xs" color="gray.600">
            総出勤数
          </Text>
        </VStack>
        <VStack spacing={1}>
          <Text fontSize="2xl" fontWeight="bold" color="blue.500">
            {storeCount}
          </Text>
          <Text fontSize="xs" color="gray.600">
            営業店舗
          </Text>
        </VStack>
      </HStack>
    </Box>
  )
}

export default HomePage