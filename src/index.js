import express from "express"
import http from "http"
import { WebSocketServer, WebSocket } from "ws"
import enforce from "express-sslify"
import User from "./models/User.js"

const app = express()
const server = http.createServer(app)
const wss = new WebSocketServer({ server })

const PORT = process.env.PORT || 3000
const allowedDomains = ["https://websocketchat.vercel.app/"]
const clients = new Map()
let users = []

// Middleware for enforcing HTTPS
app.use(enforce.HTTPS({ trustProtoHeader: true }))

app.use((req, res, next) => {
  const origin = req.get("origin")

  if (allowedDomains.includes(origin)) {
    // Allow the request
    res.setHeader("Access-Control-Allow-Origin", origin)
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
    next()
  } else {
    // Deny the request
    res.status(403).send("Forbidden")
  }
})

app.get("/", (req, res) => {
  res.send("WebSocket server is running")
})

wss.on("connection", (ws) => {
  const sendToClient = (pubKey, message) => {
    const targetClient = clients.get(pubKey)

    if (targetClient) {
      targetClient.send(message)
    } else {
      console.log(`Target client not found.`)
    }
  }

  const sendToAllClients = (message) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  }

  ws.once("message", (message) => {
    const { name, pubKey } = JSON.parse(message)
    const newUser = new User(name, pubKey)
    users = [...users, newUser]
    clients.set(pubKey, ws)

    sendToAllClients(
      JSON.stringify({
        type: "info",
        value: users,
      })
    )

    ws.on("message", (message) => {
      const { msg, from, to, timestamp } = JSON.parse(message)
      console.log(msg)
      sendToClient(
        `${to}`,
        JSON.stringify({
          type: "message",
          name: `${name}`,
          from: `${from}`,
          to: `${to}`,
          value: `${msg}`,
          timestamp: `${timestamp}`,
        })
      )
    })

    ws.on("close", () => {
      users = users.filter((user) => clients.get(user.pubKey) !== ws)
      console.log("User left", users)
      clients.delete(pubKey)

      sendToAllClients(
        JSON.stringify({
          type: "info",
          value: users,
        })
      )
    })
  })
})

server.listen(PORT, () => {
  console.log(`Server running at port: ${PORT}`)
})
