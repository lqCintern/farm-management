import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Alert,
  Select,
  Checkbox,
  Divider,
  Space,
  notification,
} from "antd";
import {
  MailOutlined,
  LockOutlined,
  UserOutlined,
  InfoCircleOutlined,
  GithubOutlined,
  GoogleOutlined,
} from "@ant-design/icons";
import { routes } from "@/constants";
import { registerUser } from "@/services/users/authService";
import { validateEmail, validatePassword } from "@/constants/function";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const RegisterForm = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState("1");

  const onFinish = async (values: any) => {
    setLoading(true);

    // Validate email and password
    const emailError = validateEmail(values.email);
    const passwordError = validatePassword(values.password);

    if (emailError || passwordError) {
      if (emailError) {
        form.setFields([{ name: "email", errors: [emailError] }]);
      }
      if (passwordError) {
        form.setFields([{ name: "password", errors: [passwordError] }]);
      }
      setLoading(false);
      return;
    }

    try {
      // Call registerUser API
      await registerUser({
        user_name: values.name,
        email: values.email,
        password: values.password,
        phone: "123456789", // Default value if needed
        fullname: values.name,
        address: "Default Address", // Default value if needed
        user_type: parseInt(values.userType || userType, 10), // Convert to integer
      });

      notification.success({
        message: "Registration Successful",
        description: "Please login with your new account",
      });

      navigate(routes.login.index);
    } catch (error: any) {
      notification.error({
        message: "Registration Failed",
        description:
          error.response?.data?.message ||
          "Account creation failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeDescription = (type: string) => {
    switch (type) {
      case "1":
        return "Create a farmer account to manage your farm activities and products.";
      case "2":
        return "Create a supplier account to sell agricultural supplies.";
      case "3":
        return "Create a trader account to purchase agricultural products.";
      default:
        return "";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      <Card style={{ width: "100%", maxWidth: 500 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={2}>Create an account</Title>
          <Paragraph type="secondary">
            Enter your details below to create your account
          </Paragraph>
        </div>

        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: "Please input your name!" }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
              placeholder="John Doe"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: "Please input your email!" }]}
          >
            <Input
              prefix={<MailOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
              placeholder="name@example.com"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
              placeholder="Create a password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("The two passwords do not match!")
                  );
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
              placeholder="Confirm your password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="userType"
            label="Account Type"
            initialValue={userType}
          >
            <Select size="large" onChange={(value) => setUserType(value)}>
              <Option value="1">Farmer (Nông dân)</Option>
              <Option value="2">Supplier (Nhà cung cấp vật tư)</Option>
              <Option value="3">Trader (Thương lái)</Option>
            </Select>
          </Form.Item>

          <Paragraph
            type="secondary"
            style={{ marginTop: -16, marginBottom: 16 }}
          >
            {getUserTypeDescription(userType)}
          </Paragraph>

          <Alert
            message={
              <span>
                <InfoCircleOutlined style={{ marginRight: 8 }} />
                Password must be at least 8 characters long and include a number
                and special character
              </span>
            }
            type="info"
            style={{ marginBottom: 16 }}
          />

          <Form.Item
            name="agreement"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error("You must accept the terms and conditions")
                      ),
              },
            ]}
          >
            <Checkbox>
              I agree to the{" "}
              <Button type="link" style={{ padding: 0 }}>
                Terms of Service
              </Button>{" "}
              and{" "}
              <Button type="link" style={{ padding: 0 }}>
                Privacy Policy
              </Button>
            </Checkbox>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              style={{ backgroundColor: "#00B207" }}
            >
              Create Account
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>Or continue with</Divider>

        <Space
          size="middle"
          style={{ width: "100%", justifyContent: "center", marginBottom: 16 }}
        >
          <Button icon={<GoogleOutlined />} size="large">
            Google
          </Button>
          <Button icon={<GithubOutlined />} size="large">
            GitHub
          </Button>
        </Space>

        <div style={{ textAlign: "center" }}>
          <Text type="secondary">
            Already have an account?{" "}
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => navigate(routes.login.index)}
            >
              Sign in
            </Button>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default RegisterForm;
