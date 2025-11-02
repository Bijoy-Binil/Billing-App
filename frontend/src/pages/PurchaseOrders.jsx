import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Input, Select, 
  Space, Card, Typography, InputNumber, Spin, 
  Empty, message, DatePicker
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  SearchOutlined, ShoppingOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { motion } from 'framer-motion';

const { Title } = Typography;
const { Option } = Select;

const PurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  // Fetch purchase orders, suppliers and products
  useEffect(() => {
    fetchPurchaseOrders();
    fetchSuppliers();
    fetchProducts();
  }, []);

  // Filter purchase orders when search text changes
  useEffect(() => {
    if (searchText) {
      const filtered = purchaseOrders.filter(
        po => 
          po.supplier.name.toLowerCase().includes(searchText.toLowerCase()) ||
          po.product.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(purchaseOrders);
    }
  }, [searchText, purchaseOrders]);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/purchase-orders/');
      if (Array.isArray(response.data)) {
        setPurchaseOrders(response.data);
        setFilteredData(response.data);
      } else if (response.data.results && Array.isArray(response.data.results)) {
        setPurchaseOrders(response.data.results);
        setFilteredData(response.data.results);
      } else {
        setPurchaseOrders([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      message.error('Failed to fetch purchase orders');
      setPurchaseOrders([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/api/suppliers/');
      if (Array.isArray(response.data)) {
        setSuppliers(response.data);
      } else if (response.data.results && Array.isArray(response.data.results)) {
        setSuppliers(response.data.results);
      } else {
        setSuppliers([]);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      message.error('Failed to fetch suppliers');
      setSuppliers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products/');
      if (Array.isArray(response.data)) {
        setProducts(response.data);
      } else if (response.data.results && Array.isArray(response.data.results)) {
        setProducts(response.data.results);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      message.error('Failed to fetch products');
      setProducts([]);
    }
  };

  const handleCreatePurchaseOrder = () => {
    form.resetFields();
    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      await axios.post('/api/purchase-orders/', values);
      message.success('Purchase order created successfully');
      setOpen(false);
      fetchPurchaseOrders();
      fetchProducts(); // Refresh products as their quantities might have changed
    } catch (error) {
      console.error('Error creating purchase order:', error);
      message.error('Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const handleProductSelect = (productId) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      form.setFieldsValue({
        cost_price: selectedProduct.cost_price || 0
      });
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Supplier',
      dataIndex: ['supplier', 'name'],
      key: 'supplier',
      render: (text, record) => record.supplier?.name || 'N/A',
    },
    {
      title: 'Product',
      dataIndex: ['product', 'name'],
      key: 'product',
      render: (text, record) => record.product?.name || 'N/A',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Cost Price',
      dataIndex: 'cost_price',
      key: 'cost_price',
      render: (text) => `₹${text.toFixed(2)}`,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (text) => `₹${text.toFixed(2)}`,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => moment(text).format('DD/MM/YYYY HH:mm'),
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-md">
        <div className="flex justify-between items-center mb-4">
          <Title level={2} className="m-0">
            <ShoppingOutlined className="mr-2" />
            Purchase Orders
          </Title>
          <Space>
            <Input
              placeholder="Search purchase orders"
              prefix={<SearchOutlined />}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-64"
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreatePurchaseOrder}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              New Purchase Order
            </Button>
          </Space>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-10">
            <Spin size="large" />
          </div>
        ) : filteredData.length > 0 ? (
          <Table
            dataSource={filteredData}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            className="shadow-sm"
          />
        ) : (
          <Empty description="No purchase orders found" />
        )}

        <Modal
          title="Create Purchase Order"
          open={open}
          onOk={handleSubmit}
          onCancel={handleCancel}
          confirmLoading={loading}
          okText="Create"
          okButtonProps={{ className: "bg-emerald-600 hover:bg-emerald-700" }}
        >
          <Form
            form={form}
            layout="vertical"
            name="purchase_order_form"
          >
            <Form.Item
              name="supplier"
              label="Supplier"
              rules={[{ required: true, message: 'Please select a supplier' }]}
            >
              <Select
                placeholder="Select a supplier"
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {suppliers.map(supplier => (
                  <Option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="product"
              label="Product"
              rules={[{ required: true, message: 'Please select a product' }]}
            >
              <Select
                placeholder="Select a product"
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                onChange={handleProductSelect}
              >
                {products.map(product => (
                  <Option key={product.id} value={product.id}>
                    {product.name} (Current Stock: {product.quantity})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="quantity"
              label="Quantity"
              rules={[{ required: true, message: 'Please enter quantity' }]}
            >
              <InputNumber min={1} className="w-full" />
            </Form.Item>

            <Form.Item
              name="cost_price"
              label="Cost Price"
              rules={[{ required: true, message: 'Please enter cost price' }]}
            >
              <InputNumber
                min={0.01}
                step={0.01}
                formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/₹\s?|(,*)/g, '')}
                className="w-full"
              />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </motion.div>
  );
};

export default PurchaseOrders;