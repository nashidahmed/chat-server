import http from "http"
import { WebSocketServer, WebSocket } from "ws"

const PORT = process.env.PORT || 3000

const server = http.createServer((req, res) => {
  // Handle HTTP requests if needed
  res.writeHead(200, { "Content-Type": "text/plain" })
  res.end("WebSocket server is running")
})

const wss = new WebSocketServer({ server })

wss.on("connection", (ws) => {
  console.log("Client connected")

  ws.send("Connected to WebSocket")

  ws.once("message", (name) => {
    console.log(`Received name: ${name}`)

    // Send a welcome message with the client's name to all connected clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        console.log(`New user ${name} joined the chat`)
        client.send(`New user ${name} joined the chat`)
      }
    })

    ws.on("message", (message) => {
      console.log(`Client says: ${message}`)
    })

    // Handle WebSocket connection closing
    ws.on("close", () => {
      console.log("Client disconnected")
    })
  })
})

server.listen(PORT, () => {
  console.log(`Server running at port: ${PORT}`)
})
