import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#4CAF50',
    colorSuccess: '#4CAF50',
    colorWarning: '#FFC107',
    colorError: '#F44336',
    colorInfo: '#2196F3',
    colorLink: '#1976D2',
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F5F5F5',
    colorBgElevated: '#FFFFFF',
    colorBorder: '#E0E0E0',
    colorBorderSecondary: '#EEEEEE',
    colorText: '#212121',
    colorTextSecondary: '#616161',
    colorTextTertiary: '#9E9E9E',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    borderRadius: 8,
    controlHeight: 40,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
    boxShadowSecondary: '0 4px 6px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04)',
  },
  components: {
    Button: {
      primaryShadow: 'none',
      defaultShadow: 'none',
    },
    Card: {
      borderRadiusLG: 12,
    },
    Menu: {
      itemSelectedBg: '#E8F5E9',
      itemSelectedColor: '#388E3C',
      itemHoverBg: '#F5F5F5',
    },
    Table: {
      headerBg: '#FAFAFA',
      borderColor: '#EEEEEE',
    },
    Layout: {
      siderBg: '#FFFFFF',
      headerBg: '#FFFFFF',
    },
    Input: {
      activeBorderColor: '#4CAF50',
      hoverBorderColor: '#81C784',
    },
  },
};
