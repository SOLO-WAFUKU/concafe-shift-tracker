/**
 * Chakra UI テーマ設定
 * アプリケーション全体のデザインシステムを定義
 */

import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

// カラーモード設定
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
}

// カスタムカラーパレット
const colors = {
  pink: {
    50: '#fef7f7',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ec4899', // メインカラー
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
  },
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
}

// コンポーネントのデフォルトスタイル
const components = {
  Button: {
    defaultProps: {
      colorScheme: 'pink',
    },
    variants: {
      solid: {
        bg: 'pink.500',
        color: 'white',
        _hover: {
          bg: 'pink.600',
        },
        _active: {
          bg: 'pink.700',
        },
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: 'xl',
        overflow: 'hidden',
        boxShadow: 'sm',
        border: '1px solid',
        borderColor: 'gray.200',
      },
    },
  },
  Badge: {
    variants: {
      solid: {
        borderRadius: 'full',
        px: 2,
        py: 1,
        fontSize: 'xs',
        fontWeight: 'bold',
      },
      subtle: {
        borderRadius: 'full',
        px: 2,
        py: 1,
        fontSize: 'xs',
        fontWeight: 'medium',
      },
    },
  },
  Input: {
    defaultProps: {
      focusBorderColor: 'pink.500',
    },
    variants: {
      outline: {
        field: {
          borderColor: 'gray.200',
          _hover: {
            borderColor: 'gray.300',
          },
          _focus: {
            borderColor: 'pink.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-pink-500)',
          },
        },
      },
    },
  },
  Checkbox: {
    defaultProps: {
      colorScheme: 'pink',
    },
  },
  Tabs: {
    defaultProps: {
      colorScheme: 'pink',
    },
    variants: {
      line: {
        tab: {
          _selected: {
            color: 'pink.600',
            borderColor: 'pink.500',
          },
        },
      },
      'soft-rounded': {
        tab: {
          _selected: {
            color: 'white',
            bg: 'pink.500',
          },
        },
      },
    },
  },
}

// フォント設定
const fonts = {
  heading: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
  body: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
}

// ブレークポイント設定
const breakpoints = {
  base: '0px',
  sm: '320px',
  md: '768px',
  lg: '960px',
  xl: '1200px',
  '2xl': '1536px',
}

// グローバルスタイル
const styles = {
  global: {
    body: {
      bg: 'gray.50',
      color: 'gray.800',
    },
    '*::placeholder': {
      color: 'gray.400',
    },
    '*, *::before, &::after': {
      borderColor: 'gray.200',
    },
    // スクロールバーのスタイリング
    '::-webkit-scrollbar': {
      width: '8px',
    },
    '::-webkit-scrollbar-track': {
      bg: 'gray.100',
    },
    '::-webkit-scrollbar-thumb': {
      bg: 'gray.300',
      borderRadius: '4px',
    },
    '::-webkit-scrollbar-thumb:hover': {
      bg: 'gray.400',
    },
  },
}

// テーマを作成
export const theme = extendTheme({
  config,
  colors,
  components,
  fonts,
  breakpoints,
  styles,
  space: {
    '4.5': '1.125rem',
    '5.5': '1.375rem',
  },
  sizes: {
    '4.5': '1.125rem',
    '5.5': '1.375rem',
  },
  radii: {
    '2xl': '1rem',
    '3xl': '1.5rem',
  },
  shadows: {
    outline: '0 0 0 3px rgba(236, 72, 153, 0.6)',
  },
})