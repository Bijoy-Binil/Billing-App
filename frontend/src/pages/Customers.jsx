import React, { useState, useEffect } from "react";
import {
  Layout,
  Table,
  Card,
  Button,
  Input,
  Modal,
  Form,
  message,
  Tabs,
  Drawer,
  Spin,
  Row,
  Col,
  Space,
} from "antd";
import {
  UserAddOutlined,
  SearchOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import axios from "axios";
import LoyaltyCard from "../components/LoyaltyCard";
import PurchaseHistory from "../components/PurchaseHistory";

const { Content } = Layout;
const { TabPane } = Tabs;

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [customerDetailVisible, setCustomerDetailVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerLoyalty, setCustomerLoyalty] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Fetch all customers
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/customers/");
      setCustomers(
        Array.isArray(response.data)
          ? response.data
          : response.data.results || []
      );
    } catch (error) {
      message.error("Failed to fetch customers");
      console.error(error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Handle Add / Edit
  const handleFormSubmit = async (values) => {
    try {
      if (editingCustomerId) {
        await axios.put(`/api/customers/${editingCustomerId}/`, values);
        message.success("Customer updated successfully");
      } else {
        await axios.post("/api/customers/", values);
        message.success("Customer added successfully");
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingCustomerId(null);
      fetchCustomers();
    } catch (error) {
      message.error("Operation failed");
      console.error(error);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/customers/${id}/`);
      message.success("Customer deleted successfully");
      fetchCustomers();
    } catch (error) {
      message.error("Failed to delete customer");
      console.error(error);
    }
  };

  // View details
  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setCustomerDetailVisible(true);
    fetchCustomerDetails(customer.id);
  };

  const fetchCustomerDetails = async (id) => {
    setDetailsLoading(true);
    try {
      const loyalty = await axios.get(`/api/customer-loyalty/${id}/`);
      const history = await axios.get(
        `/api/customer-analytics/${id}/purchase-history/`
      );
      setCustomerLoyalty(loyalty.data);
      setPurchaseHistory(history.data);
    } catch (error) {
      message.error("Failed to fetch customer details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchText.toLowerCase()) ||
      c.contact_number.includes(searchText)
  );

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Contact", dataIndex: "contact_number", key: "contact_number" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Total Spent",
      dataIndex: "total_spent",
      key: "total_spent",
      render: (v) => (v ? `₹${parseFloat(v).toFixed(2)}` : "₹0.00"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            type="primary"
            ghost
            onClick={() => handleViewDetails(record)}
            className="bg-emerald-600 text-white border-none hover:bg-emerald-500"
          />
          <Button
            icon={<EditOutlined />}
            className="text-emerald-400 hover:text-emerald-300"
            onClick={() => {
              setEditingCustomerId(record.id);
              form.setFieldsValue(record);
              setIsModalVisible(true);
            }}
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Layout
     className="p-6 min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
    >
      <Content className="p-8">
        <Card
          title={<span className="text-emerald-400 text-xl">Customer Management</span>}
          className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-xl shadow-lg"
          extra={
            <Space>
              <Input
                placeholder="Search customers..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{
                  width: 250,
                  backgroundColor: "#1f2937",
                  color: "#f9fafb",
                  borderColor: "#374151",
                }}
              />
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                className="bg-emerald-600 hover:bg-emerald-500 border-none"
                onClick={() => {
                  setEditingCustomerId(null);
                  form.resetFields();
                  setIsModalVisible(true);
                }}
              >
                Add Customer
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={filteredCustomers}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 8 }}
          />
        </Card>

        {/* Modal */}
        <Modal
          title={
            editingCustomerId ? "Edit Customer" : "Add Customer"
          }
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
            <Form.Item name="name" label="Name" rules={[{ required: true }]}>
              <Input prefix={<UserOutlined />} placeholder="Customer Name" />
            </Form.Item>
            <Form.Item
              name="contact_number"
              label="Contact Number"
              rules={[{ required: true }]}
            >
              <Input placeholder="Contact Number" />
            </Form.Item>
            <Form.Item name="email" label="Email">
              <Input type="email" placeholder="Email" />
            </Form.Item>
            <Form.Item name="address" label="Address">
              <Input.TextArea placeholder="Address" />
            </Form.Item>
            <Form.Item name="date_of_birth" label="Date of Birth">
              <Input type="date" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                className="bg-emerald-600 hover:bg-emerald-500 border-none"
              >
                {editingCustomerId ? "Update" : "Add"}
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Drawer */}
        <Drawer
          title={
            selectedCustomer
              ? `${selectedCustomer.name}'s Profile`
              : "Customer Profile"
          }
          placement="right"
          width={720}
          onClose={() => setCustomerDetailVisible(false)}
          open={customerDetailVisible}
          className="bg-gray-900 text-gray-100"
        >
          {detailsLoading ? (
            <div className="text-center py-16">
              <Spin size="large" />
            </div>
          ) : (
            <Tabs defaultActiveKey="1">
              <TabPane tab="Customer Info" key="1">
                {selectedCustomer && (
                  <Card className="bg-gray-800/60 border border-gray-700 backdrop-blur-lg">
                    <Row gutter={16}>
                      <Col span={12}>
                        <p><strong>Name:</strong> {selectedCustomer.name}</p>
                        <p><strong>Contact:</strong> {selectedCustomer.contact_number}</p>
                        <p><strong>Email:</strong> {selectedCustomer.email || "N/A"}</p>
                      </Col>
                      <Col span={12}>
                        <p><strong>Address:</strong> {selectedCustomer.address || "N/A"}</p>
                        <p><strong>DOB:</strong> {selectedCustomer.date_of_birth || "N/A"}</p>
                        <p><strong>Customer Since:</strong> {new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                      </Col>
                    </Row>
                  </Card>
                )}
              </TabPane>
              <TabPane tab="Loyalty Program" key="2">
                <LoyaltyCard loyalty={customerLoyalty} />
              </TabPane>
              <TabPane tab="Purchase History" key="3">
                <PurchaseHistory purchaseData={purchaseHistory} />
              </TabPane>
            </Tabs>
          )}
        </Drawer>
      </Content>
    </Layout>
  );
};

export default Customers;
