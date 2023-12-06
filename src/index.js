import http from "http"
import { WebSocketServer, WebSocket } from "ws"

const PORT = process.env.PORT || 3000
let users

const server = http.createServer((req, res) => {
  // Handle HTTP requests if needed
  res.writeHead(200, { "Content-Type": "text/plain" })
  res.end("WebSocket server is running")
})

const wss = new WebSocketServer({ server })

wss.on("connection", (ws) => {
  // This broadcasts the message to all other clients connected to this server
  const sendToAllClients = (message) => {
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  }

  ws.once("message", (name) => {
    // Send a message with the new client's name to all connected clients
    sendToAllClients(
      JSON.stringify({
        type: "info",
        value: `${name} joined the chat`,
      })
    )

    // When a client sends a message broadcast it to all other clients
    ws.on("message", (message) => {
      const msg = JSON.parse(message).msg
      const timestamp = JSON.parse(message).timestamp
      sendToAllClients(
        JSON.stringify({
          type: "message",
          name: `${name}`,
          value: `${msg}`,
          timestamp: `${timestamp}`,
        })
      )
    })

    // When a client closes its connection, inform all other clients
    ws.on("close", () => {
      sendToAllClients(
        JSON.stringify({
          type: "info",
          value: `${name} left the chat`,
        })
      )
    })
  })
})

server.listen(PORT, () => {
  console.log(`Server running at port: ${PORT}`)
})
