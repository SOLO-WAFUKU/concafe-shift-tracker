/**
 * 日付タブコンポーネント
 * 日付選択用のタブナビゲーション
 */

import React from 'react'
import { 
  Tabs, 
  TabList, 
  Tab, 
  Box, 
  useBreakpointValue,
  HStack,
  Button,
  Icon
} from '@chakra-ui/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
// Local utility functions (replaced @/lib/utils)
const getDateLabel = (date: string) => {
  const today = new Date()
  const targetDate = new Date(date)
  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return '今日'
  if (diffDays === 1) return '明日'
  if (diffDays === -1) return '昨日'
  
  // Format as MM/DD (曜日)
  const month = targetDate.getMonth() + 1
  const day = targetDate.getDate()
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][targetDate.getDay()]
  return `${month}/${day}(${weekday})`
}

const generateDateRange = (days: number) => {
  const dates = []
  const today = new Date()
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    dates.push(date.toISOString().split('T')[0])
  }
  
  return dates
}

interface DateTabsProps {
  /** 選択中の日付 */
  selectedDate: string
  /** 日付選択時のコールバック */
  onDateChange: (date: string) => void
  /** 表示する日数 */
  days?: number
  /** コンパクトモード */
  compact?: boolean
}

/**
 * 日付タブコンポーネント
 */
export const DateTabs: React.FC<DateTabsProps> = ({
  selectedDate,
  onDateChange,
  days = 7,
  compact = false
}) => {
  const dates = generateDateRange(days)
  const selectedIndex = dates.indexOf(selectedDate)
  
  // レスポンシブ対応
  const tabSize = useBreakpointValue({ base: 'sm', md: 'md' })
  const variant = useBreakpointValue({ base: 'soft-rounded', md: 'line' })
  const orientation = useBreakpointValue<'horizontal' | 'vertical'>({ 
    base: 'horizontal', 
    md: 'horizontal' 
  })

  const handleTabChange = (index: number) => {
    const selectedDate = dates[index]
    if (selectedDate) {
      onDateChange(selectedDate)
    }
  }

  // 前の日/次の日ナビゲーション
  const goToPreviousDay = () => {
    const currentIndex = dates.indexOf(selectedDate)
    if (currentIndex > 0) {
      onDateChange(dates[currentIndex - 1])
    }
  }

  const goToNextDay = () => {
    const currentIndex = dates.indexOf(selectedDate)
    if (currentIndex < dates.length - 1) {
      onDateChange(dates[currentIndex + 1])
    }
  }

  if (compact) {
    return (
      <HStack spacing={2} justify="space-between" w="full">
        <Button
          size="sm"
          variant="ghost"
          onClick={goToPreviousDay}
          isDisabled={selectedIndex === 0}
          leftIcon={<ChevronLeft size={16} />}
        >
          前日
        </Button>
        
        <Box 
          fontSize="lg" 
          fontWeight="bold" 
          color="pink.600"
          textAlign="center"
          minW="120px"
        >
          {getDateLabel(selectedDate)}
        </Box>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={goToNextDay}
          isDisabled={selectedIndex === dates.length - 1}
          rightIcon={<ChevronRight size={16} />}
        >
          翌日
        </Button>
      </HStack>
    )
  }

  return (
    <Box overflowX="auto" w="full">
      <Tabs 
        index={selectedIndex}
        onChange={handleTabChange}
        variant={variant}
        orientation={orientation}
        colorScheme="pink"
        size={tabSize}
      >
        <TabList 
          minW="fit-content"
          flexWrap={useBreakpointValue({ base: 'nowrap', md: 'wrap' })}
          overflowX="auto"
          sx={{
            '::-webkit-scrollbar': {
              display: 'none'
            },
            scrollbarWidth: 'none'
          }}
        >
          {dates.map((date, index) => {
            const label = getDateLabel(date)
            const isToday = index === 0
            const isTomorrow = index === 1
            
            return (
              <Tab
                key={date}
                minW={useBreakpointValue({ base: '80px', md: 'auto' })}
                fontSize={useBreakpointValue({ base: 'xs', md: 'sm' })}
                fontWeight={isToday || isTomorrow ? 'bold' : 'normal'}
                color={isToday ? 'pink.600' : 'gray.600'}
                _selected={{
                  color: 'pink.600',
                  fontWeight: 'bold',
                  borderColor: 'pink.500'
                }}
                _hover={{
                  color: 'pink.500'
                }}
              >
                {label}
              </Tab>
            )
          })}
        </TabList>
      </Tabs>
    </Box>
  )
}

/**
 * シンプル日付セレクター
 */
export const SimpleDateSelector: React.FC<{
  selectedDate: string
  onDateChange: (date: string) => void
  dates: string[]
}> = ({ selectedDate, onDateChange, dates }) => {
  return (
    <HStack spacing={2} wrap="wrap">
      {dates.map((date) => (
        <Button
          key={date}
          size="sm"
          variant={selectedDate === date ? 'solid' : 'outline'}
          colorScheme="pink"
          onClick={() => onDateChange(date)}
        >
          {getDateLabel(date)}
        </Button>
      ))}
    </HStack>
  )
}

export default DateTabs