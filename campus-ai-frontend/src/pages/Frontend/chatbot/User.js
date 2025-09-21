import React from "react";
import { Button, Card } from "antd";
import { useAuthContext } from "../../../context/AuthContext"; // ✅ make sure path is correct

export default function User() {
  const { isAuthenticated, user, logout } = useAuthContext();

  if (!isAuthenticated) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1e1e2f",
          color: "white",
        }}
      >
        <h3>You are not logged in</h3>
      </div>
    );
  }

  return (
    <div
      className="d-flex flex-column justify-content-center align-items-center"
      style={{ height: "100vh", backgroundColor: "#1e1e2f", padding: "20px" }}
    >
      <Card
        style={{ width: 400, backgroundColor: "#2a2a40", color: "white" }}
        bordered={false}
      >
        <h3 style={{ color: "white" }}>👤 User Profile</h3>
        <p>
          <strong>Email:</strong> {user?.email}
        </p>
        <p>
          <strong>Name:</strong> {user?.firstName}
        </p>
        <Button type="primary" danger block onClick={logout}>
          Logout
        </Button>
      </Card>
    </div>
  );
}
