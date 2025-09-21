import React, { useState } from 'react'
import { Button, Checkbox, Col, Form, Image, Input, Row, Typography } from 'antd'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import registerImg from '../../assets/registerImg.png'
import toastify from '../../global/globals'
const { Title, Text } = Typography
const initialState = { firstName: "", lastName: "", email: "", password: "" }

export default function Register() {
  const [state, setState] = useState(initialState)
  const { dispatch } = useAuthContext()
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = e => setState(s => ({ ...s, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    let { firstName, email, password, lastName } = state
    firstName = firstName.trim()

    if (firstName.length <= 3) {
      return window.toastify("Please Enter Correct Name", 'error')
    }
    if (password.length <= 5) {
      return window.toastify("Password must be at least 6 characters", 'error')
    }
    setIsLoading(true)
    try {
      const res = await axios.post("http://127.0.0.1:8000/auth/register", state)
      // const { data } = res.data
      console.log('user', res)
      
      window.toastify("User Successfully Registered", 'success')
      navigate('/auth/login')
    } catch (error) {
      if (error.response?.status === 400) {
        window.toastify(error.response.data.detail || "Email already exists", 'error')
      } else {
        window.toastify("Registration failed", 'error')
      }
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <Row>
      <Col sm={24} md={12} lg={16} className='d-none d-md-block'>
        <Image src={registerImg} width='100%' height='100vh' className='object-fit-cover' preview={false} />
      </Col>
      <Col sm={24} md={12} lg={8} className='d-flex flex-column p-4 p-md-5'>
        <Title level={3}>Create New Account</Title>
        <Text className='text-muted mb-2'>Please enter details</Text>
        <Form layout='vertical' className='w-75' onSubmitCapture={handleSubmit}>
          <Form.Item label="First Name">
            <Input name='firstName' type='text' onChange={handleChange} />
          </Form.Item>
          <Form.Item label="Last Name">
            <Input name='lastName' type='text' onChange={handleChange} />
          </Form.Item>
          <Form.Item label="Email">
            <Input name='email' type='email' onChange={handleChange} />
          </Form.Item>
          <Form.Item label="Password">
            <Input type='password' name='password' onChange={handleChange} />
          </Form.Item>
          <Form.Item>
            <Checkbox><Text strong>I agree to the Terms & Condition</Text></Checkbox>
          </Form.Item>
          <Form.Item>
            <Button type="primary" size='large' block htmlType="submit" loading={isLoading}>
              Register
            </Button>
          </Form.Item>
        </Form>
      </Col>
    </Row>
  )
}

