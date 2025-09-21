import React, { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Typography, Select, List, Spin, message } from "antd";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";

const { Title } = Typography;
const { Option } = Select;

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [recentStudents, setRecentStudents] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [selectedDept, setSelectedDept] = useState("Computer Science");

  const API_BASE = "http://localhost:8000/student/analytics"; // adjust if deployed

  // Fetch all data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Total students
        const totalRes = await axios.get(`${API_BASE}/total_students`);
        console.log('totalRes', totalRes)
        setTotalStudents(totalRes.data.total_students);

        // Default department stats
        handleDepartmentChange(selectedDept);

        // Recent students
        const recentRes = await axios.get(`${API_BASE}/recent_students`);
        setRecentStudents(recentRes.data.recent_students || []);
      } catch (err) {
        message.error("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Handle department change
  const handleDepartmentChange = async (dept) => {
    setSelectedDept(dept);
    try {
      const res = await axios.get(`${API_BASE}/students_by_department/${dept}`);
      setDepartmentData([{ name: dept, value: res.data.count || 0 }]);
    } catch (err) {
      message.error("Failed to load department data");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <Title level={2}>Campus Analytics Dashboard</Title>
      {loading ? (
        <Spin size="large" />
      ) : (
        <Row gutter={16}>
          {/* Total Students */}
          <Col span={8}>
            <Card bordered={false}>
              <Statistic title="Total Students" value={totalStudents} />
            </Card>
          </Col>

          {/* Department Filter */}
          <Col span={8}>
            <Card bordered={false}>
              <Title level={5}>Students by Department</Title>
              <Select
                value={selectedDept}
                style={{ width: "100%" }}
                onChange={handleDepartmentChange}
              >
                <Option value="Computer Science">Computer Science</Option>
                <Option value="Mathematics">Mathematics</Option>
                <Option value="Physics">Physics</Option>
              </Select>

              {/* Pie Chart */}
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={departmentData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    fill="#8884d8"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={["#0088FE", "#00C49F", "#FFBB28"][index % 3]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* Recent Students */}
          <Col span={8}>
            <Card bordered={false}>
              <Title level={5}>Recent Onboarded Students</Title>
              <List
                dataSource={recentStudents}
                renderItem={(student) => (
                  <List.Item>
                    <List.Item.Meta
                      title={student.name}
                      description={`${student.department} - ${student.email}`}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
