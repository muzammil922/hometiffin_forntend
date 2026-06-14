import axios from 'axios'

const whatsappClient = axios.create({
  baseURL: import.meta.env.VITE_WHATSAPP_MIDDLEWARE_URL || 'http://localhost:5001/api',
  headers: {
    'x-api-key': import.meta.env.VITE_WHATSAPP_MIDDLEWARE_KEY || 'development_key'
  }
})

export const whatsappService = {
  getStatus: () => whatsappClient.get('/whatsapp/status'),
  connect: () => whatsappClient.post('/whatsapp/connect'),
  disconnect: () => whatsappClient.post('/whatsapp/disconnect'),
  sendMessage: (phone, message) => 
    whatsappClient.post('/whatsapp/send-message', { phone, message }),
  sendMedia: (phone, mediaUrl, caption) => 
    whatsappClient.post('/whatsapp/send-media', { phone, mediaUrl, caption })
}
