import { message } from "antd";


const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

window.isEmail = email => emailRegex.test(email)




window.toastify = (msg,type) => {
    switch (type) {
        case 'success': return message.success(msg)
        case 'error': return message.error(msg)
        default:
            return message.info(msg)
    }
}