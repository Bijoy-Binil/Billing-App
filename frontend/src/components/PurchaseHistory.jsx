import React from "react";
import { Card, Table, Typography, Statistic, Row, Col, List, Tag, Space, Tooltip } from "antd";
import { AreaChartOutlined, ShoppingOutlined, DollarOutlined, ClockCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const PurchaseHistory = ({ purchaseData }) => {
  if (!purchaseData) {
    return (
      <Card title="Purchase History" bordered={false}>
        <Text type="secondary">No purchase history available</Text>
      </Card>
    );
  }

  const { total_spent, total_bills, average_bill_value, recent_purchases, frequent_products } = purchaseData;

  // Format currency (₹ instead of $)
  const formatCurrency = (value) => {
    const num = parseFloat(value || 0);
    return `₹${num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Payment status colors
  const statusColors = {
    pending: "orange",
    paid: "green",
    failed: "red",
  };

  // Recent purchases table columns
  const columns = [
    {
      title: "Bill ID",
      dataIndex: "bill_id",
      key: "bill_id",
      render: (text) => <a>{text}</a>,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Items",
      dataIndex: "items_count",
      key: "items_count",
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (value) => formatCurrency(value),
    },
    {
      title: "Status",
      dataIndex: "payment_status",
      key: "payment_status",
      render: (status) => <Tag color={statusColors[status] || "default"}>{status ? status.toUpperCase() : "N/A"}</Tag>,
    },
  ];

  return (
    <div className="purchase-history">
      <Card
        title={
          <Space>
            <AreaChartOutlined />
            <span>Purchase History & Analytics</span>
          </Space>
        }
        bordered={false}
        style={{
          marginBottom: 16,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        {/* Summary Statistics */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Statistic
              title="Total Spent"
              value={formatCurrency(total_spent)}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Total Purchases"
              value={total_bills}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Average Bill"
              value={formatCurrency(average_bill_value)}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Col>
        </Row>

        {/* Recent Purchases Table */}
        <Title level={4}>
          <ClockCircleOutlined /> Recent Purchases
        </Title>
        <Table
          dataSource={recent_purchases}
          columns={columns}
          rowKey="bill_id"
          pagination={false}
          size="small"
          style={{
            backgroundColor: "#fafafa",
            borderRadius: 8,
          }}
        />

        {/* Frequent Products */}
        <Title level={4} style={{ marginTop: 24 }}>
          <ShoppingOutlined /> Most Purchased Products
        </Title>
        <List
          size="small"
          bordered
          dataSource={frequent_products}
          style={{ borderRadius: 8 }}
          renderItem={(item) => (
            <List.Item>
              <Space style={{ width: "100%", justifyContent: "space-between" }}>
                <Text strong>{item.product__name}</Text>
                <Space>
                  <Tooltip title="Number of purchases">
                    <Tag color="blue">{item.count}x</Tag>
                  </Tooltip>
                  <Tooltip title="Total quantity purchased">
                    <Tag color="purple">{item.total_quantity} units</Tag>
                  </Tooltip>
                </Space>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default PurchaseHistory;
