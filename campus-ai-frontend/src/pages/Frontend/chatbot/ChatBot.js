import React, { useState, useRef } from "react";
import { Layout, Menu, Input, Card, Spin, message, Dropdown, Button, Tag, Alert, Avatar } from "antd";
import {
  RobotOutlined,
  PlusOutlined,
  SearchOutlined,
  MessageOutlined,
  CloseOutlined,
  FileOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  UploadOutlined,
  FileAddOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useAuthContext } from "../../../context/AuthContext";

const { Header, Sider, Content } = Layout;

const ChatBot = () => {
  // Default chat setup
  const defaultId = Date.now().toString();
  const [chats, setChats] = useState([{ id: defaultId, title: "New Chat" }]);
  const [activeChat, setActiveChat] = useState(defaultId);
  const [chatHistory, setChatHistory] = useState({ [defaultId]: [] });
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedPDF, setUploadedPDF] = useState(null);
  const fileInputRef = useRef(null);
  const { user, logout } = useAuthContext();

  // File selection
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

  // Upload/Remove PDF
  const handleUploadPDF = async () => {
    if (!selectedFile) {
      message.warning("Please select a PDF file first");
      return;
    }
    setUploadLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const { data } = await axios.post(`http://127.0.0.1:8000/agentic-rag/upload/${user.id}/${activeChat}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadedPDF({ filename: data.filename, pages: data.pages || 1 });

      const systemMessage = {
        role: "system",
        content: `📄 PDF "${data.filename}" `,
        type: "upload-success",
      };

      setChatHistory((prev) => ({
        ...prev,
        [activeChat]: [...prev[activeChat], systemMessage],
      }));

      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      message.success(data.message);
    } catch (error) {
      message.error(error.response?.data?.error || "Failed to upload PDF. Try again.");
    } finally {
      setUploadLoading(false);
    }
  };

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
        [activeChat]: [...prev[activeChat], systemMessage],
      }));

      message.success("PDF removed successfully");
    } catch {
      message.error("Failed to remove PDF");
    }
  };

  // Menus
  const plusMenuItems = [
    { key: "addFile", icon: <FileAddOutlined />, label: "Select PDF", onClick: handleFileSelect },
    { key: "upload", icon: <UploadOutlined />, label: "Upload PDF", onClick: handleUploadPDF, disabled: !selectedFile || uploadLoading },
  ];

  const menuItems = [
    { key: "user", label: <div style={{ fontWeight: "bold" }}>{user?.firstName || "User"}</div>, disabled: true },
    { key: "settings", icon: <SettingOutlined />, label: "Settings", onClick: () => message.info("Settings clicked") },
    { type: "divider" },
    { key: "logout", icon: <LogoutOutlined />, danger: true, label: "Logout", onClick: logout },
  ];

const handleNewChat = () => {
  if (!chatHistory[activeChat] || chatHistory[activeChat].length === 0) {
    message.warning("You must ask at least one question before starting a new chat.");
    return;
  }

  const newId = Math.random().toString(36).substring(2, 10)
  setChats((prev) => [
    ...prev,
    { id: newId, title: "New Chat", createdAt: new Date().toISOString() }
  ]);
  setActiveChat(newId);
  setChatHistory((prev) => ({ ...prev, [newId]: [] }));
  setSelectedFile(null);
  setUserInput("");

  if (uploadedPDF) {
    const systemMessage = {
      role: "system",
      content: `📄 PDF "${uploadedPDF.filename}" is ready for questions.`,
      type: "pdf-ready",
    };
    setTimeout(() => {
      setChatHistory((prev) => ({ ...prev, [newId]: [systemMessage] }));
    }, 100);
  }
};




const handleDeleteChat = (chatId) => {
  // Prevent deleting the last chat
  if (chats.length === 1) {
    message.warning("You cannot delete the last remaining chat.");
    return;
  }

  setChats((prev) => prev.filter((chat) => chat.id !== chatId));

  // Also remove its history
  setChatHistory((prev) => {
    const updatedHistory = { ...prev };
    delete updatedHistory[chatId];
    return updatedHistory;
  });

  // If the active chat is deleted, set another one as active
  if (activeChat === chatId) {
    const remainingChats = chats.filter((chat) => chat.id !== chatId);
    if (remainingChats.length > 0) {
      setActiveChat(remainingChats[0].id);
    }
  }

  message.success("Chat deleted successfully.");
};


  // const handleSend = async () => {
  //   if (!userInput.trim()) {
  //     message.warning("Please enter a message.");
  //     return;
  //   }

  //   const userMessage = { role: "user", content: userInput };
  //   setChatHistory((prev) => ({ ...prev, [activeChat]: [...prev[activeChat], userMessage] }));

  //   setChats((prev) =>
  //     prev.map((chat) =>
  //       chat.id === activeChat && chat.title === "New Chat" && !["hi", "hello", "hey"].includes(userInput.toLowerCase())
  //         ? { ...chat, title: userInput }
  //         : chat
  //     )
  //   );

  //   const currentInput = userInput;
  //   setUserInput("");
  //   setLoading(true);

  //   try {
  //     const { data } = await axios.post(
  //       `http://127.0.0.1:8000/agentic-rag/chat?query=${encodeURIComponent(currentInput)}`
  //     );

  //     const aiMessage = {
  //       role: "assistant",
  //       content: data.answer || "No response received.",
  //       usedPDF: data.answer?.includes("Based on the uploaded PDF document:"),
  //     };

  //     setChatHistory((prev) => ({ ...prev, [activeChat]: [...prev[activeChat], aiMessage] }));
  //   } catch (error) {
  //     const errorMsg = {
  //       role: "assistant",
  //       content:
  //         error.response?.status === 400 && error.response?.data?.error?.includes("No PDF uploaded")
  //           ? "No PDF uploaded. Please upload one first."
  //           : "Failed to process your request. Try again later.",
  //       isError: true,
  //     };
  //     setChatHistory((prev) => ({ ...prev, [activeChat]: [...prev[activeChat], errorMsg] }));
  //   } finally {
  //     setLoading(false);
  //   }
  // };



  const hospitalKeywords = [
  "hospital",
  "clinic",
  "doctor",
  "medicine",
  "medical",
  "health",
  "pharmacy",
  "treatment",
  "appointment",
  "location",
  "nearby doctor"
];


const handleSend = async () => {
  if (!userInput.trim()) {
    message.warning("Please enter a message.");
    return;
  }
  const userMessage = { role: "user", content: userInput };
  setChatHistory((prev) => ({
    ...prev,
    [activeChat]: [...prev[activeChat], userMessage],
  }));

  // Update chat title if first message
  setChats((prev) =>
    prev.map((chat) =>
      chat.id === activeChat &&
      chat.title === "New Chat" &&
      !["hi", "hello", "hey"].includes(userInput.toLowerCase())
        ? { ...chat, title: userInput }
        : chat
    )
  );

  const currentInput = userInput;
  setUserInput("");
  setLoading(true);

  try {
    let data;

    const isHospitalQuery = hospitalKeywords.some((word) =>
      currentInput.toLowerCase().includes(word)
    );

    if (isHospitalQuery) {
      // ✅ Hospital API with user.id + activeChat + query

      const response = await axios.post(
        `http://127.0.0.1:8000/agentic-hospital/chat/${user.id}/${activeChat}/${currentInput}`,
      );
      data = response.data;
    } else {
      // ✅ RAG API with user.id + activeChat
      const response = await axios.post(
        `http://127.0.0.1:8000/agentic-rag/chat/${user.id}/${activeChat}/${currentInput}`
      );
      data = response.data;
    }

    console.log("data", data);

    const aiMessage = {
      role: "assistant",
      content: data.response || data.answer || "No response received.",
      usedPDF: data.answer?.includes("Based on the uploaded PDF document:"),
    };

    setChatHistory((prev) => ({
      ...prev,
      [activeChat]: [...prev[activeChat], aiMessage],
    }));
  } catch (error) {
    console.error(error);
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
      [activeChat]: [...prev[activeChat], errorMsg],
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
      <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} accept=".pdf" />

      {/* Sidebar */}
      <Sider theme="light" width={260}>
        <div style={{ padding: "16px", fontWeight: "bold", fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
          <RobotOutlined style={{ fontSize: 20, color: "#1677ff" }} /> <span>Otter AI</span>
        </div>

        <Menu mode="inline" selectable={false}>
          <Menu.Item key="new" icon={<PlusOutlined />} onClick={handleNewChat}>New Chat</Menu.Item>
          <Menu.Item key="search" icon={<SearchOutlined />}>
            <Input placeholder="Search chats..." bordered={false} />
          </Menu.Item>
        </Menu>

        <div style={{ padding: "8px 16px", fontWeight: "bold" }}>Chats:</div>
        <Menu
          mode="inline"
          selectedKeys={[activeChat]}
          style={{ maxHeight: "50vh", overflowY: "auto" }}
        >
          {chats.map((chat) => (
            <Menu.Item key={chat.id} icon={<MessageOutlined />} onClick={() => setActiveChat(chat.id)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{chat.title}</span>
                <DeleteOutlined
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent switching chat
                    handleDeleteChat(chat.id);
                  }}
                  style={{ color: "red", marginLeft: 8 }}
                />
              </div>
            </Menu.Item>
          ))}
        </Menu>


        {/* <Menu mode="inline" selectedKeys={[activeChat]} onClick={(e) => setActiveChat(e.key)} style={{ maxHeight: "50vh", overflowY: "auto" }}>
          {chats.map((chat) => (
            <Menu.Item key={chat.id} icon={<MessageOutlined />}>{chat.title}</Menu.Item>
          ))}
        </Menu> */}
      </Sider>

      {/* Main */}
      <Layout>
        <Header style={{ background: "#fff", padding: "0 16px", boxShadow: "0 1px 4px rgba(0,21,41,.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4 style={{ margin: 0 }}>
            Otter Chat {uploadedPDF && <Tag color="blue" style={{ marginLeft: "8px" }}>📄 PDF Ready</Tag>}
          </h4>
          <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
            <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} /> <span>{user?.firstName || "User"}</span>
            </div>
          </Dropdown>
        </Header>

        <Content style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)" }}>
          <Card bordered={false} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              {chatHistory[activeChat]?.length ? (
                chatHistory[activeChat].map((msg, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: msg.role === "system" ? "center" : msg.role === "user" ? "flex-end" : "flex-start", marginBottom: "16px" }}>
                    {msg.role === "system" ? (
                      <Alert message={msg.content} type={msg.type === "upload-success" ? "success" : "info"} showIcon style={{ maxWidth: "80%", fontSize: "14px" }} />
                    ) : (
                      <Card
                        style={{
                          maxWidth: msg.role === "user" ? (msg.content.length > 100 ? "60%" : "70%") : msg.content.length > 100 ? "80%" : "70%",
                          background: msg.isError ? "#fff1f0" : msg.role === "user" ? "#f8f8f8" : "#fff",
                          border: msg.isError ? "1px solid #ffccc7" : msg.role === "user" ? "1px solid #e8e8e8" : "1px solid #d9d9d9",
                          borderRadius: "12px",
                          marginRight: msg.role === "user" ? "16px" : 0,
                          marginLeft: msg.role === "assistant" ? "16px" : 0,
                        }}
                        bodyStyle={{ padding: "12px 16px", color: msg.isError ? "#ff4d4f" : msg.role === "user" ? "#333" : "#000" }}
                      >
                        <div style={{ fontWeight: "500", marginBottom: "4px", fontSize: "12px", color: msg.isError ? "#ff4d4f" : msg.role === "user" ? "#666" : "#1677ff" }}>
                          {msg.role === "user" ? user.firstName || "You" : msg.isError ? "Error" : "AI Assistant"}
                          {msg.usedPDF && <Tag style={{ marginLeft: "4px" }}>📄 PDF</Tag>}
                        </div>
                        <div style={{ lineHeight: "1.5" }}>{msg.content}</div>
                      </Card>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#888" }}>
                  <div style={{ marginBottom: "16px", fontSize: "16px" }}>👋 Welcome to Otter AI!</div>
                  <div>• Upload a PDF to ask questions</div>
                  <div>• Or ask general questions anytime</div>
                </div>
              )}
            </div>
          </Card>

          {/* Input */}
          <div style={{ marginBottom: "16px" }}>
            {selectedFile && (
              <div style={{ marginBottom: "8px", padding: "8px 12px", background: "#f0f8ff", border: "1px solid #d4edda", borderRadius: "8px", display: "flex", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FileOutlined style={{ color: "#1677ff" }} />
                  <span>{selectedFile.name}</span>
                  <span style={{ fontSize: "12px", color: "#666" }}>({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  <Button type="primary" size="small" icon={<CloudUploadOutlined />} onClick={handleUploadPDF} loading={uploadLoading}>Upload</Button>
                </div>
                <Button type="text" size="small" icon={<CloseOutlined />} onClick={handleRemoveFile} style={{ color: "#ff4d4f" }} />
              </div>
            )}

            <Input.Search
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={uploadedPDF ? `Ask about "${uploadedPDF.filename}" or anything else...` : "Ask Otter anything..."}
              enterButton={loading ? <Spin /> : "Send"}
              size="large"
              onSearch={handleSend}
              disabled={loading}
              addonBefore={<Dropdown menu={{ items: plusMenuItems }} trigger={["click"]}><PlusOutlined style={{ fontSize: 18, cursor: "pointer", color: "#1677ff" }} /></Dropdown>}
            />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ChatBot;

// import React, { useState, useRef } from "react";
// import { Layout, Menu, Input, Card, Spin, message, Dropdown, Avatar } from "antd";
// import {
//   RobotOutlined,
//   PlusOutlined,
//   SearchOutlined,
//   MessageOutlined,
//   UserOutlined,
//   SettingOutlined,
//   LogoutOutlined,
//   UploadOutlined,
//   FileAddOutlined,
// } from "@ant-design/icons";
// import axios from "axios";
// import { useAuthContext } from "../../../context/AuthContext";

// const { Header, Sider, Content } = Layout;

// const ChatBot = () => {
//   // create one default chat on first load
//   const defaultId = Date.now().toString();
//   const [chats, setChats] = useState([{ id: defaultId, title: "New Chat" }]);
//   const [activeChat, setActiveChat] = useState(defaultId);
//   const [chatHistory, setChatHistory] = useState({ [defaultId]: [] });
//   const [loading, setLoading] = useState(false);
//   const [userInput, setUserInput] = useState("");
//   const { user, logout } = useAuthContext();
  
//   // file upload state
//   const [selectedFile, setSelectedFile] = useState(null);
//   const fileInputRef = useRef(null);

//   // handle file selection
//   const handleFileClick = () => {
//     fileInputRef.current.click(); // open file dialog
//   };

//   const handleFileChange = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     setSelectedFile(file);

//     // Show file message in chat (as user)
//     const userMessage = { role: "user", content: `📂 Uploaded file: ${file.name}` };
//     setChatHistory((prev) => ({
//       ...prev,
//       [activeChat]: [...prev[activeChat], userMessage],
//     }));

//     // Upload file to backend
//     const formData = new FormData();
//     formData.append("file", file);

//     setLoading(true);
//     try {
//       const response = await axios.post("http://127.0.0.1:8000/agent/upload", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       const aiMessage = {
//         role: "assistant",
//         content: response.data.answer || "✅ File processed successfully.",
//       };

//       setChatHistory((prev) => ({
//         ...prev,
//         [activeChat]: [...prev[activeChat], aiMessage],
//       }));
//     } catch (error) {
//       const errorMessage = {
//         role: "assistant",
//         content: "❌ Failed to upload file. Please try again.",
//       };
//       setChatHistory((prev) => ({
//         ...prev,
//         [activeChat]: [...prev[activeChat], errorMessage],
//       }));
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Define dropdown menu for "+" icon
//   const plusMenuItems = [
//     {
//       key: "addFile",
//       icon: <FileAddOutlined />,
//       label: "Add File",
//       onClick: handleFileClick,
//     },
//     {
//       key: "upload",
//       icon: <UploadOutlined />,
//       label: "Upload",
//       onClick: () => message.info("Upload clicked"),
//     },
//   ];

//   // Dropdown menu items for user
//   const menuItems = [
//     {
//       key: "user",
//       label: (
//         <div style={{ fontWeight: "bold" }}>
//           {user?.firstName || "User"}
//         </div>
//       ),
//       disabled: true,
//     },
//     {
//       key: "settings",
//       icon: <SettingOutlined />,
//       label: "Settings",
//       onClick: () => message.info("Settings clicked"),
//     },
//     {
//       type: "divider",
//     },
//     {
//       key: "logout",
//       icon: <LogoutOutlined />,
//       danger: true,
//       label: "Logout",
//       onClick: () => logout(),
//     },
//   ];

//   // Create a new chat
//   const handleNewChat = () => {
//     const newId = Date.now().toString();
//     setChats((prev) => [...prev, { id: newId, title: "New Chat" }]);
//     setActiveChat(newId);
//     setChatHistory((prev) => ({ ...prev, [newId]: [] }));
//   };

//   // Send query
//   const handleSend = async () => {
//     if (!userInput.trim()) {
//       message.warning("Please enter a query.");
//       return;
//     }

//     const userMessage = { role: "user", content: userInput };
//     setChatHistory((prev) => ({
//       ...prev,
//       [activeChat]: [...prev[activeChat], userMessage],
//     }));

//     // update chat title if still "New Chat"
//     setChats((prev) =>
//       prev.map((chat) =>
//         chat.id === activeChat &&
//         chat.title === "New Chat" &&
//         !["hi", "hello", "hey"].includes(userInput.toLowerCase())
//           ? { ...chat, title: userInput }
//           : chat
//       )
//     );

//     const currentInput = userInput;
//     setUserInput("");
//     setLoading(true);

//     try {
//       const response = await axios.post("http://127.0.0.1:8000/agent/chat", {
//         query: currentInput,
//       });

//       const aiMessage = {
//         role: "assistant",
//         content: response.data.answer || "No response received.",
//       };

//       setChatHistory((prev) => ({
//         ...prev,
//         [activeChat]: [...prev[activeChat], aiMessage],
//       }));
//     } catch (error) {
//       const errorMessage = {
//         role: "assistant",
//         content: "Failed to process your request. Please try again later.",
//       };
//       setChatHistory((prev) => ({
//         ...prev,
//         [activeChat]: [...prev[activeChat], errorMessage],
//       }));
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Layout style={{ minHeight: "100vh" }}>
//       {/* Sidebar */}
//       <Sider theme="light" width={260}>
//         <div style={{ padding: "16px", fontWeight: "bold", fontSize: "18px" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//             <RobotOutlined style={{ fontSize: 20, color: "#1677ff" }} />
//             <span>Otter AI</span>
//           </div>
//         </div>

//         {/* Menu */}
//         <Menu mode="inline" selectable={false}>
//           <Menu.Item key="new" icon={<PlusOutlined />} onClick={handleNewChat}>
//             New Chat
//           </Menu.Item>
//           <Menu.Item key="search" icon={<SearchOutlined />}>
//             <Input
//               placeholder="Search chats..."
//               style={{ width: "100%" }}
//               bordered={false}
//             />
//           </Menu.Item>
//         </Menu>

//         {/* Chats List */}
//         <div style={{ padding: "8px 16px", fontWeight: "bold" }}>Chats:</div>
//         <div style={{ flex: 1, overflowY: "auto", maxHeight: "50vh" }}>
//           <Menu
//             mode="inline"
//             selectedKeys={[activeChat]}
//             onClick={(e) => setActiveChat(e.key)}
//           >
//             {chats.map((chat) => (
//               <Menu.Item key={chat.id} icon={<MessageOutlined />}>
//                 {chat.title}
//               </Menu.Item>
//             ))}
//           </Menu>
//         </div>
//       </Sider>

//       {/* Main Content */}
//       <Layout>
//         {/* Sticky Header */}
//         <Header
//           style={{
//             background: "#fff",
//             padding: "0 16px",
//             boxShadow: "0 1px 4px rgba(0,21,41,.08)",
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             position: "sticky",
//             top: 0,
//             zIndex: 1000,
//           }}
//         >
//           <h4 style={{ margin: 0 }}>Otter Chat</h4>

//           {/* Dropdown for User Menu */}
//           <Dropdown
//             menu={{ items: menuItems }}
//             placement="bottomRight"
//             trigger={["click"]}
//           >
//             <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
//               <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
//               <span>{user?.firstName || "User"}</span>
//             </div>
//           </Dropdown>
//         </Header>

//         <Content
//           style={{
//             display: "flex",
//             flexDirection: "column",
//             height: "calc(100vh - 64px)",
//           }}
//         >
//           <Card
//             bordered={false}
//             style={{ flex: 1, display: "flex", flexDirection: "column" }}
//           >
//             <div
//               style={{
//                 maxHeight: "calc(100vh - 200px)",
//                 overflowY: "auto",
//                 flex: 1,
//               }}
//             >
//               {chatHistory[activeChat]?.length > 0 ? (
//   chatHistory[activeChat].map((msg, index) => (
//     <Card
//       key={index}
//       style={{
//         marginBottom: "8px",
//         background: msg.role === "user" ? "#e6f7ff" : "#f6ffed",
//         borderRadius: "8px",
//       }}
//       bodyStyle={{ padding: "12px" }}
//     >
//       <strong>{msg.role === "user" ? user.firstName : "AI:"}</strong>
//       <div style={{ marginTop: "6px" }}>
//         {msg.type === "file" ? (
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               padding: "8px",
//               border: "1px solid #d9d9d9",
//               borderRadius: "6px",
//               background: "#fafafa",
//               marginBottom: "6px",
//             }}
//           >
//             <UploadOutlined style={{ fontSize: 20, marginRight: 8 }} />
//             <div>
//               <div style={{ fontWeight: 500 }}>{msg.file.name}</div>
//               <div style={{ fontSize: 12, color: "#888" }}>File</div>
//             </div>
//           </div>
//         ) : (
//           <span>{msg.content}</span>
//         )}
//       </div>
//     </Card>
//   ))
// ) : (
//   <div
//     style={{
//       textAlign: "center",
//       padding: "20px",
//       color: "#888",
//     }}
//   >
//     No messages yet. Start typing...
//   </div>
// )}

//             </div>
//           </Card>

//           {/* Input */}
//           <div style={{ marginBottom: "16px" }}>
//             <Input.Search
//               value={userInput}
//               onChange={(e) => setUserInput(e.target.value)}
//               placeholder="Ask Otter anything..."
//               enterButton={loading ? <Spin /> : "Send"}
//               size="large"
//               onSearch={handleSend}
//               disabled={loading}
//               addonBefore={
//                 <Dropdown menu={{ items: plusMenuItems }} trigger={["click"]}>
//                   <PlusOutlined
//                     style={{
//                       fontSize: 18,
//                       cursor: "pointer",
//                       color: "#1677ff",
//                     }}
//                   />
//                 </Dropdown>
//               }
//             />
//             {/* Hidden File Input */}
//             <input
//               type="file"
//               ref={fileInputRef}
//               style={{ display: "none" }}
//               onChange={handleFileChange}
//             />
//           </div>
//         </Content>
//       </Layout>
//     </Layout>
//   );
// };

// export default ChatBot;






// import React, { useState, useRef } from "react";
// import { Layout, Menu, Input, Card, Spin, message, Dropdown, Upload, Button, Tag } from "antd";
// import {
//   RobotOutlined,
//   PlusOutlined,
//   SearchOutlined,
//   MessageOutlined,
//   CloseOutlined,
//   FileOutlined,
//   DownloadOutlined,
// } from "@ant-design/icons";
// import axios from "axios";
// import { useAuthContext } from "../../../context/AuthContext";
// import { Avatar } from "antd";
// import { UserOutlined, SettingOutlined, LogoutOutlined } from "@ant-design/icons";
// import { UploadOutlined, FileAddOutlined } from "@ant-design/icons";

// const { Header, Sider, Content } = Layout;

// const ChatBot = () => {
//   // create one default chat on first load
//   const defaultId = Date.now().toString();
//   const [chats, setChats] = useState([{ id: defaultId, title: "New Chat" }]);
//   const [activeChat, setActiveChat] = useState(defaultId);
//   const [chatHistory, setChatHistory] = useState({ [defaultId]: [] });
//   const [loading, setLoading] = useState(false);
//   const [userInput, setUserInput] = useState("");
//   const [selectedFile, setSelectedFile] = useState(null);
//   const { user, logout } = useAuthContext();
//   const fileInputRef = useRef(null);

//   // Handle file selection
//   const handleFileSelect = () => {
//     fileInputRef.current?.click();
//   };

//   // Handle file input change
//   const handleFileChange = (event) => {
//     const file = event.target.files[0];
//     if (file) {
//       // Check file size (limit to 10MB)
//       if (file.size > 10 * 1024 * 1024) {
//         message.error("File size should not exceed 10MB");
//         return;
//       }
      
//       setSelectedFile(file);
//       message.success(`File "${file.name}" selected successfully`);
//     }
//   };

//   // Remove selected file
//   const handleRemoveFile = () => {
//     setSelectedFile(null);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
//   };

//   // Define dropdown menu for "+" icon
//   const plusMenuItems = [
//     {
//       key: "addFile",
//       icon: <FileAddOutlined />,
//       label: "Add File",
//       onClick: handleFileSelect,
//     },
//     {
//       key: "upload",
//       icon: <UploadOutlined />,
//       label: "Upload",
//       onClick: () => message.info("Upload clicked"),
//     },
//   ];

//   // Dropdown menu items
//   const menuItems = [
//     {
//       key: "user",
//       label: (
//         <div style={{ fontWeight: "bold" }}>
//           {user?.firstName || "User"}
//         </div>
//       ),
//       disabled: true, // just display user name
//     },
//     {
//       key: "settings",
//       icon: <SettingOutlined />,
//       label: "Settings",
//       onClick: () => message.info("Settings clicked"),
//     },
//     {
//       type: "divider",
//     },
//     {
//       key: "logout",
//       icon: <LogoutOutlined />,
//       danger: true,
//       label: "Logout",
//       onClick: () => logout(),
//     },
//   ];

//   // Create a new chat (only when user clicks "New Chat")
//   const handleNewChat = () => {
//     const newId = Date.now().toString();
//     setChats((prev) => [...prev, { id: newId, title: "New Chat" }]);
//     setActiveChat(newId);
//     setChatHistory((prev) => ({ ...prev, [newId]: [] }));
//     // Clear any selected file when creating new chat
//     setSelectedFile(null);
//     setUserInput("");
//   };

//   // Format file size
//   const formatFileSize = (bytes) => {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   };

//   // Send query with optional file
//   const handleSend = async () => {
//     if (!userInput.trim() && !selectedFile) {
//       message.warning("Please enter a message or select a file.");
//       return;
//     }

//     // Create user message object
//     const userMessage = {
//       role: "user",
//       content: userInput || "Shared a file",
//       file: selectedFile ? {
//         name: selectedFile.name,
//         size: selectedFile.size,
//         type: selectedFile.type,
//       } : null,
//     };

//     setChatHistory((prev) => ({
//       ...prev,
//       [activeChat]: [...prev[activeChat], userMessage],
//     }));

//     // Update chat title if still "New Chat"
//     const titleText = userInput || selectedFile?.name || "File Upload";
//     setChats((prev) =>
//       prev.map((chat) =>
//         chat.id === activeChat &&
//         chat.title === "New Chat" &&
//         !["hi", "hello", "hey"].includes(titleText.toLowerCase())
//           ? { ...chat, title: titleText }
//           : chat
//       )
//     );

//     const currentInput = userInput;
//     const currentFile = selectedFile;
    
//     // Clear input and file
//     setUserInput("");
//     setSelectedFile(null);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
    
//     setLoading(true);

//     try {
//       // Prepare form data for file upload
//       const formData = new FormData();
//       formData.append("query", currentInput || "Please analyze this file");
      
//       if (currentFile) {
//         formData.append("file", currentFile);
//       }

//       const response = await axios.post("http://127.0.0.1:8000/agent/chat", formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//       });

//       const aiMessage = {
//         role: "assistant",
//         content: response.data.answer || "No response received.",
//       };

//       setChatHistory((prev) => ({
//         ...prev,
//         [activeChat]: [...prev[activeChat], aiMessage],
//       }));
//     } catch (error) {
//       console.error("Error sending message:", error);
//       const errorMessage = {
//         role: "assistant",
//         content: "Failed to process your request. Please try again later.",
//       };
//       setChatHistory((prev) => ({
//         ...prev,
//         [activeChat]: [...prev[activeChat], errorMessage],
//       }));
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Render file attachment component
//   const renderFileAttachment = (file) => {
//     return (
//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           padding: "8px 12px",
//           background: "#f5f5f5",
//           borderRadius: "6px",
//           marginTop: "8px",
//           border: "1px dashed #d9d9d9",
//         }}
//       >
//         <FileOutlined style={{ marginRight: "8px", color: "#1677ff" }} />
//         <div style={{ flex: 1 }}>
//           <div style={{ fontWeight: "500", fontSize: "14px" }}>
//             {file.name}
//           </div>
//           <div style={{ fontSize: "12px", color: "#666" }}>
//             {formatFileSize(file.size)} • {file.type || "Unknown type"}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <Layout style={{ minHeight: "100vh" }}>
//       {/* Hidden file input */}
//       <input
//         ref={fileInputRef}
//         type="file"
//         style={{ display: "none" }}
//         onChange={handleFileChange}
//         accept="*/*" // Accept all file types, you can restrict this as needed
//       />

//       {/* Sidebar */}
//       <Sider theme="light" width={260}>
//         <div style={{ padding: "16px", fontWeight: "bold", fontSize: "18px" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//             <RobotOutlined style={{ fontSize: 20, color: "#1677ff" }} />
//             <span>Otter AI</span>
//           </div>
//         </div>

//         {/* Menu */}
//         <Menu mode="inline" selectable={false}>
//           <Menu.Item key="new" icon={<PlusOutlined />} onClick={handleNewChat}>
//             New Chat
//           </Menu.Item>
//           <Menu.Item key="search" icon={<SearchOutlined />}>
//             <Input
//               placeholder="Search chats..."
//               style={{ width: "100%" }}
//               bordered={false}
//             />
//           </Menu.Item>
//         </Menu>

//         {/* Chats List */}
//         <div style={{ padding: "8px 16px", fontWeight: "bold" }}>Chats:</div>
//         <div style={{ flex: 1, overflowY: "auto", maxHeight: "50vh" }}>
//           <Menu
//             mode="inline"
//             selectedKeys={[activeChat]}
//             onClick={(e) => setActiveChat(e.key)}
//           >
//             {chats.map((chat) => (
//               <Menu.Item key={chat.id} icon={<MessageOutlined />}>
//                 {chat.title}
//               </Menu.Item>
//             ))}
//           </Menu>
//         </div>
//       </Sider>

//       {/* Main Content */}
//       <Layout>
//         {/* Sticky Header */}
//         <Header
//           style={{
//             background: "#fff",
//             padding: "0 16px",
//             boxShadow: "0 1px 4px rgba(0,21,41,.08)",
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             position: "sticky",
//             top: 0,
//             zIndex: 1000,
//           }}
//         >
//           <h4 style={{ margin: 0 }}>Otter Chat</h4>

//           {/* Dropdown for User Menu */}
//           <Dropdown
//             menu={{ items: menuItems }}
//             placement="bottomRight"
//             trigger={["click"]}
//           >
//             <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
//               <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
//               <span>{user?.firstName || "User"}</span>
//             </div>
//           </Dropdown>
//         </Header>

//         <Content
//           style={{
//             display: "flex",
//             flexDirection: "column",
//             height: "calc(100vh - 64px)",
//           }}
//         >
//           <Card
//             bordered={false}
//             style={{ flex: 1, display: "flex", flexDirection: "column" }}
//           >
//             <div
//               style={{
//                 maxHeight: "calc(100vh - 200px)",
//                 overflowY: "auto",
//                 flex: 1,
//               }}
//             >
//               {chatHistory[activeChat]?.length > 0 ? (
//                 chatHistory[activeChat].map((msg, index) => (
//                   <Card
//                     key={index}
//                     style={{
//                       marginBottom: "8px",
//                       background:
//                         msg.role === "user" ? "#e6f7ff" : "#f6ffed",
//                       borderRadius: "8px",
//                     }}
//                     bodyStyle={{ padding: "12px" }}
//                   >
//                     <div>
//                       <strong>{msg.role === "user" ? user.firstName : "AI: "}</strong>{" "}
//                       {msg.content}
//                     </div>
//                     {msg.file && renderFileAttachment(msg.file)}
//                   </Card>
//                 ))
//               ) : (
//                 <div
//                   style={{
//                     textAlign: "center",
//                     padding: "20px",
//                     color: "#888",
//                   }}
//                 >
//                   No messages yet. Start typing or upload a file...
//                 </div>
//               )}
//             </div>
//           </Card>

//           {/* File Preview and Input */}
//           <div style={{ marginBottom: "16px" }}>
//             {/* File Preview */}
//             {selectedFile && (
//               <div
//                 style={{
//                   marginBottom: "8px",
//                   padding: "12px",
//                   background: "#f9f9f9",
//                   borderRadius: "6px",
//                   border: "1px solid #e6e6e6",
//                 }}
//               >
//                 <div
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "space-between",
//                   }}
//                 >
//                   <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
//                     <FileOutlined style={{ marginRight: "8px", color: "#1677ff" }} />
//                     <div>
//                       <div style={{ fontWeight: "500" }}>{selectedFile.name}</div>
//                       <div style={{ fontSize: "12px", color: "#666" }}>
//                         {formatFileSize(selectedFile.size)} • {selectedFile.type || "Unknown type"}
//                       </div>
//                     </div>
//                   </div>
//                   <Button
//                     type="text"
//                     size="small"
//                     icon={<CloseOutlined />}
//                     onClick={handleRemoveFile}
//                     style={{ color: "#ff4d4f" }}
//                   />
//                 </div>
//               </div>
//             )}

//             {/* Input Search */}
//             <Input.Search
//               value={userInput}
//               onChange={(e) => setUserInput(e.target.value)}
//               placeholder={selectedFile ? "Add a message (optional)..." : "Ask Otter anything..."}
//               enterButton={loading ? <Spin /> : "Send"}
//               size="large"
//               onSearch={handleSend}
//               disabled={loading}
//               addonBefore={
//                 <Dropdown
//                   menu={{ items: plusMenuItems }}
//                   trigger={["click"]}
//                 >
//                   <PlusOutlined
//                     style={{
//                       fontSize: 18,
//                       cursor: "pointer",
//                       color: "#1677ff",
//                     }}
//                   />
//                 </Dropdown>
//               }
//             />
//           </div>
//         </Content>
//       </Layout>
//     </Layout>
//   );
// };

// export default ChatBot;