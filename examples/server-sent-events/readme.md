# Rakkas server-sent events example

This example shows how to use Rakkas to implement a simple server-sent events (SSE) server. It's a simple chat room server with the following features:

- Clients can connect to the server and send messages to the server, which will then be broadcast to all connected clients.
- The server remembers the last 10 messages in a ring buffer and sends them to new clients or clients that reconnect. It uses the `Last-Event-ID` header to determine which messages need to be sent.
- The client ID is stored in session storage so different tabs will be treated as different clients.
- The server sends a ping every 10 seconds to keep the connection alive when behind a proxy that times out idle connections.
