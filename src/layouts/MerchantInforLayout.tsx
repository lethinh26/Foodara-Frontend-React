import { Layout } from 'antd'
import { Content } from 'antd/es/layout/layout'
import { Outlet } from 'react-router-dom'

const MerchantInforLayout = () => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      
      <Layout
        style={{
          transition: "margin-left 0.2s",
        }}>
        <Content style={{ padding: 24, minHeight: "calc(100vh - 64px)" }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MerchantInforLayout