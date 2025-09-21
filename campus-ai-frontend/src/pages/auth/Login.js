import React, { useState } from 'react'
import { Button, Checkbox, Col, Form, Image, Input, Row, Typography } from 'antd'
import loginImg from '../../assets/loginImg.png'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import axios from 'axios'

const { Title, Text } = Typography
const initialState = { email: "", password: "" }

export default function Login() {
  const [state, setState] = useState(initialState)
  const [isProcessing, setIsProcessing] = useState(false)
  const { dispatch, isAuthenticated } = useAuthContext()
  const navigate = useNavigate()

  const handleChange = e => setState(s => ({ ...s, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { email, password } = state

    if (!window.isEmail(email)) {
      return window.toastify("Invalid Email", 'error')
    }
    if (password.length < 6) {
      return window.toastify("Password must be at least 6 characters", 'error')
    }

    setIsProcessing(true)
    
    try {
      const res = await axios.post("http://127.0.0.1:8000/auth/login", { email, password })
      const { token,data } = res.data
      console.log('res login token', token)
      console.log('res login data', data)
      localStorage.setItem("token", token)
      dispatch({ type: "SET_LOGGED_IN", payload: { token: token} })
      dispatch({ type: "SET_PROFILE", payload: { userData:data } })
      window.toastify("Successfully Logged In", 'success')
      setState(initialState)
      navigate('/')
    } catch (error) {
      if (error.response?.status === 401) {
        window.toastify("Invalid Email or Password", 'error')
      } else {
        window.toastify("Login failed", 'error')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Row>
      <Col sm={24} md={12} lg={16}>
        <Image src={loginImg} width='100%' height='100vh' className='object-fit-cover' preview={false} />
      </Col>
      <Col sm={24} md={12} lg={8} className='d-flex justify-content-center flex-column ps-4'>
        <Title level={3}>Welcome</Title>
        <Text className='text-muted mb-2'>Please login here</Text>
        <Form layout='vertical' className='w-75' onSubmitCapture={handleSubmit}>
          <Form.Item label='Email Address'>
            <Input name='email' type='email' onChange={handleChange} />
          </Form.Item>
          <Form.Item label='Password'>
            <Input.Password name='password' onChange={handleChange} />
          </Form.Item>
          <Form.Item>
            <div className="d-flex justify-content-between">
              <Checkbox>Remember me</Checkbox>
              <Link to='' style={{ textDecoration: 'none' }}>Forget Password</Link>
            </div>
          </Form.Item>
          <Form.Item>
            <Button type="primary" block size='large' loading={isProcessing} htmlType="submit">
              Login
            </Button>
            <h6 className='mt-3'>Don’t have an account? <Link to='/auth/register'>Register</Link></h6>
          </Form.Item>
        </Form>
      </Col>
    </Row>
  )
}
