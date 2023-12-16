import express from "express"
import http from "http"
import { WebSocketServer, WebSocket } from "ws"
import enforce from "express-sslify"

const app = express()
const server = http.createServer(app)
const wss = new WebSocketServer({ server })

const PORT = process.env.PORT || 3000
let users = []

// Middleware for enforcing HTTPS
app.use(enforce.HTTPS({ trustProtoHeader: true }))

app.get("/", (req, res) => {
  res.send("WebSocket server is running")
})

wss.on("connection", (ws) => {
  const sendToAllClients = (message) => {
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  }

  ws.once("message", (name) => {
    users.push({ name, ws })

    sendToAllClients(
      JSON.stringify({
        type: "info",
        value: `${name} joined the chat`,
      })
    )

    ws.on("message", (message) => {
      const { msg, timestamp } = JSON.parse(message)
      sendToAllClients(
        JSON.stringify({
          type: "message",
          name: `${name}`,
          value: `${msg}`,
          timestamp: `${timestamp}`,
        })
      )
    })

    ws.on("close", () => {
      users = users.filter((user) => user.ws !== ws)
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
