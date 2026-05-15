import React from 'react';
import { Card, Result, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';

const CompleteStep: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Card style={{ borderRadius: 12, textAlign: 'center' }}>
      <Result
        status="success"
        title="Đăng ký đối tác thành công!"
        subTitle="Hồ sơ của bạn đã được tiếp nhận và đang trong quá trình xét duyệt (1-3 ngày làm việc)."
        extra={[
          <Space key="actions" direction="vertical" style={{ width: '100%' }}>
            <Button type="primary" block size="large" onClick={() => navigate('/merchant')}>
              Đi đến trang quản trị
            </Button>
            <Button block onClick={() => navigate('/merchant')}>
              Về trang hồ sơ đối tác
            </Button>
          </Space>
        ]}
      />
    </Card>
  );
};

export default CompleteStep;