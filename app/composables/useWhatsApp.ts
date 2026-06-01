export interface WhatsAppConnection {
  connected: boolean
  status: 'active' | 'pending' | 'disconnected'
  phoneNumber: string
  businessName: string
  connectedAt: string
}

const defaultConnection: WhatsAppConnection = {
  connected: true,
  status: 'active',
  phoneNumber: '+49 170 1234567',
  businessName: 'Zum Grauen Wolf',
  connectedAt: 'June 15, 2026',
}

export function useWhatsApp() {
  const connection = useState<WhatsAppConnection>('whatsapp-connection', () => ({ ...defaultConnection }))

  const isConnected = computed(() => connection.value.connected)

  function connect() {
    connection.value = { ...defaultConnection, connected: true, status: 'active' }
  }

  function disconnect() {
    connection.value = {
      ...connection.value,
      connected: false,
      status: 'disconnected',
    }
  }

  return { connection, isConnected, connect, disconnect }
}
