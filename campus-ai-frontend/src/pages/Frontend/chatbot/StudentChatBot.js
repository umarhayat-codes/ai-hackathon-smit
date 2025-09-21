import React, { useState, useRef } from "react";
import {
  Layout,
  Menu,
  Input,
  Card,
  Spin,
  message,
  Dropdown,
  Button,
  Tag,
  Alert,
  Avatar,
} from "antd";
import {
  RobotOutlined,
  SearchOutlined,
  MessageOutlined,
  CloseOutlined,
  FileOutlined,
  CloudUploadOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  UploadOutlined,
  FileAddOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useAuthContext } from "../../../context/AuthContext";
import Dashboard from "./Dashboard";

const { Header, Sider, Content } = Layout;

const StudentChatBot = () => {
  // ✅ Single Chat Only
  const defaultId = "main-chat";
  const [chatHistory, setChatHistory] = useState({ [defaultId]: [] });
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedPDF, setUploadedPDF] = useState(null);
  const fileInputRef = useRef(null);
  const { user, logout } = useAuthContext();

  // ✅ Sidebar Navigation
  const [selectedMenu, setSelectedMenu] = useState("chatbot");

  // File Selection
  const handleFileSelect = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.includes("pdf")) {
      message.error("Only PDF files are supported");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      message.error("File size must be less than 10MB");
      return;
    }
    setSelectedFile(file);
    message.success(`PDF "${file.name}" selected. Click upload to process it.`);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Upload PDF
  const handleUploadPDF = async () => {
    if (!selectedFile) {
      message.warning("Please select a PDF file first");
      return;
    }
    setUploadLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const { data } = await axios.post(
        `http://127.0.0.1:8000/agentic-rag/upload/${user.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setUploadedPDF({ filename: data.filename, pages: data.pages || 1 });

      const systemMessage = {
        role: "system",
        content: `📄 PDF "${data.filename}" `,
        type: "upload-success",
      };

      setChatHistory((prev) => ({
        ...prev,
        [defaultId]: [...prev[defaultId], systemMessage],
      }));

      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      message.success(data.message);
    } catch (error) {
      message.error(
        error.response?.data?.error || "Failed to upload PDF. Try again."
      );
    } finally {
      setUploadLoading(false);
    }
  };

  // Remove PDF
  const handleRemovePDF = async () => {
    try {
      await axios.post("http://127.0.0.1:8000/agentic-rag/reset");
      setUploadedPDF(null);

      const systemMessage = {
        role: "system",
        content: "📄 PDF document has been removed.",
        type: "upload-removed",
      };

      setChatHistory((prev) => ({
        ...prev,
        [defaultId]: [...prev[defaultId], systemMessage],
      }));

      message.success("PDF removed successfully");
    } catch {
      message.error("Failed to remove PDF");
    }
  };

  // Dropdown Menus
  const plusMenuItems = [
    {
      key: "addFile",
      icon: <FileAddOutlined />,
      label: "Select PDF",
      onClick: handleFileSelect,
    },
    {
      key: "upload",
      icon: <UploadOutlined />,
      label: "Upload PDF",
      onClick: handleUploadPDF,
      disabled: !selectedFile || uploadLoading,
    },
  ];

  const menuItems = [
    {
      key: "user",
      label: (
        <div style={{ fontWeight: "bold" }}>{user?.firstName || "User"}</div>
      ),
      disabled: true,
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
      onClick: () => message.info("Settings clicked"),
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      danger: true,
      label: "Logout",
      onClick: logout,
    },
  ];

  

  // Send Message
  // ✅ Send Message
 

  const handleSend = async () => {
  if (!userInput.trim()) {
    message.warning("Please enter a message.");
    return;
  }

  const userMessage = { role: "user", content: userInput };
  setChatHistory((prev) => ({
    ...prev,
    [defaultId]: [...prev[defaultId], userMessage],
  }));

  const currentInput = userInput;
  setUserInput("");
  setLoading(true);

  try {
    let data;

    // ✅ Keywords for student info
    const studentKeywords = ["student", "id", "grade", "attendance", "name", "email","library",'cafeteria','event schedule'];

    const isStudentQuery = studentKeywords.some((kw) =>
      currentInput.toLowerCase().includes(kw)
    );

    if (isStudentQuery) {
      // Always call student/chatbot
      const response = await axios.get(
        `http://127.0.0.1:8000/student/chatbot/${user.id}/${currentInput}`
      );
      data = response.data;
    } else if (uploadedPDF) {
      // PDF-related question → call agentic-rag/chat
      const response = await axios.post(
        `http://127.0.0.1:8000/agentic-rag/chat/${user.id}/${currentInput}`
      );
      data = response.data;
    } else {
      // Default fallback → student/chatbot
      const response = await axios.get(
        `http://127.0.0.1:8000/student/chatbot/${user.id}/${currentInput}`
      );
      data = response.data;
    }

    const aiMessage = {
      role: "assistant",
      content: data.response || data.answer || "No response received.",
      usedPDF: uploadedPDF && !isStudentQuery, // mark PDF only if PDF API was used
    };

    setChatHistory((prev) => ({
      ...prev,
      [defaultId]: [...prev[defaultId], aiMessage],
    }));
  } catch (error) {
    const errorMsg = {
      role: "assistant",
      content:
        error.response?.status === 400 &&
        error.response?.data?.error?.includes("No PDF uploaded")
          ? "No PDF uploaded. Please upload one first."
          : "Failed to process your request. Try again later.",
      isError: true,
    };

    setChatHistory((prev) => ({
      ...prev,
      [defaultId]: [...prev[defaultId], errorMsg],
    }));
  } finally {
    setLoading(false);
  }
};








  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
        accept=".pdf"
      />

      {/* Sidebar */}
      <Sider theme="light" width={260}>
        <div
          style={{
            padding: "16px",
            fontWeight: "bold",
            fontSize: "18px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <RobotOutlined style={{ fontSize: 20, color: "#1677ff" }} />{" "}
          <span>Campus AI</span>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedMenu]}
          onClick={(e) => setSelectedMenu(e.key)}
        >
          <Menu.Item key="chatbot" icon={<MessageOutlined />}>
            Chatbot
          </Menu.Item>
          <Menu.Item key="dashboard" icon={<FileOutlined />}>
            Dashboard
          </Menu.Item>
        </Menu>
      </Sider>

      {/* Main */}
      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 16px",
            boxShadow: "0 1px 4px rgba(0,21,41,.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h4 style={{ margin: 0 }}>
            {selectedMenu === "chatbot" ? "AI Campus Agent" : "Dashboard"}{" "}
            {uploadedPDF && selectedMenu === "chatbot" && (
              <Tag color="blue" style={{ marginLeft: "8px" }}>
                📄 PDF Ready
              </Tag>
            )}
          </h4>
          <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
            <div
              style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
            >
              <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />{" "}
              <span>{user?.firstName || "User"}</span>
            </div>
          </Dropdown>
        </Header>

        <Content
          style={{
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 64px)",
          }}
        >
          {selectedMenu === "chatbot" ? (
            <>
              {/* Chat Area */}
              <Card
                bordered={false}
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
                  {chatHistory[defaultId]?.length ? (
                    chatHistory[defaultId].map((msg, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent:
                            msg.role === "system"
                              ? "center"
                              : msg.role === "user"
                              ? "flex-end"
                              : "flex-start",
                          marginBottom: "16px",
                        }}
                      >
                        {msg.role === "system" ? (
                          <Alert
                            message={msg.content}
                            type={
                              msg.type === "upload-success" ? "success" : "info"
                            }
                            showIcon
                            style={{ maxWidth: "80%", fontSize: "14px" }}
                          />
                        ) : (
                          <Card
                            style={{
                              maxWidth:
                                msg.role === "user"
                                  ? msg.content.length > 100
                                    ? "60%"
                                    : "70%"
                                  : msg.content.length > 100
                                  ? "80%"
                                  : "70%",
                              background: msg.isError
                                ? "#fff1f0"
                                : msg.role === "user"
                                ? "#f8f8f8"
                                : "#fff",
                              border: msg.isError
                                ? "1px solid #ffccc7"
                                : msg.role === "user"
                                ? "1px solid #e8e8e8"
                                : "1px solid #d9d9d9",
                              borderRadius: "12px",
                              marginRight: msg.role === "user" ? "16px" : 0,
                              marginLeft: msg.role === "assistant" ? "16px" : 0,
                            }}
                            bodyStyle={{
                              padding: "12px 16px",
                              color: msg.isError
                                ? "#ff4d4f"
                                : msg.role === "user"
                                ? "#333"
                                : "#000",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: "500",
                                marginBottom: "4px",
                                fontSize: "12px",
                                color: msg.isError
                                  ? "#ff4d4f"
                                  : msg.role === "user"
                                  ? "#666"
                                  : "#1677ff",
                              }}
                            >
                              {msg.role === "user"
                                ? user.firstName || "You"
                                : msg.isError
                                ? "Error"
                                : "AI Assistant"}
                              {msg.usedPDF && (
                                <Tag style={{ marginLeft: "4px" }}>📄 PDF</Tag>
                              )}
                            </div>
                            <div style={{ lineHeight: "1.5" }}>{msg.content}</div>
                          </Card>
                        )}
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "40px 20px",
                        color: "#888",
                      }}
                    >
                      <div style={{ marginBottom: "16px", fontSize: "16px" }}>
                        👋 Welcome to Otter AI!
                      </div>
                      <div>• Upload a PDF to ask questions</div>
                      <div>• Or ask general questions anytime</div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Input */}
              <div style={{ marginBottom: "16px" }}>
                {selectedFile && (
                  <div
                    style={{
                      marginBottom: "8px",
                      padding: "8px 12px",
                      background: "#f0f8ff",
                      border: "1px solid #d4edda",
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FileOutlined style={{ color: "#1677ff" }} />
                      <span>{selectedFile.name}</span>
                      <span style={{ fontSize: "12px", color: "#666" }}>
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                      <Button
                        type="primary"
                        size="small"
                        icon={<CloudUploadOutlined />}
                        onClick={handleUploadPDF}
                        loading={uploadLoading}
                      >
                        Upload
                      </Button>
                    </div>
                    <Button
                      type="text"
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={handleRemoveFile}
                      style={{ color: "#ff4d4f" }}
                    />
                  </div>
                )}

                <Input.Search
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    uploadedPDF
                      ? `Ask about "${uploadedPDF.filename}" or anything else...`
                      : "Ask Otter anything..."
                  }
                  enterButton={loading ? <Spin /> : "Send"}
                  size="large"
                  onSearch={handleSend}
                  disabled={loading}
                  addonBefore={
                    <Dropdown menu={{ items: plusMenuItems }} trigger={["click"]}>
                      <PlusOutlined
                        style={{
                          fontSize: 18,
                          cursor: "pointer",
                          color: "#1677ff",
                        }}
                      />
                    </Dropdown>
                  }
                />
              </div>
            </>
          ) : (
            <Dashboard/>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentChatBot;
