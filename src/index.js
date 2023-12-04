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
  ws.once("message", (name) => {
    // Send a message with the new client's name to all connected clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "info",
            value: `${name} joined the chat`,
          })
        )
      }
    })

    ws.on("message", (message) => {
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "message",
              name: `${name}`,
              value: `${message}`,
            })
          )
        }
      })
    })

    // Handle WebSocket connection closing
    ws.on("close", () => {
      console.log("Client disconnected")

      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "info",
              value: `${name} left the chat`,
            })
          )
        }
      })
    })
  })
})

server.listen(PORT, () => {
  console.log(`Server running at port: ${PORT}`)
})
