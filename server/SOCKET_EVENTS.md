Socket.IO events emitted by the backend

This document describes the Socket.IO events emitted from the Express + MongoDB backend so the frontend can subscribe and update UI accordingly.

Events

- guest:created
  - Payload: The full guest document as returned by Mongoose after creation.
  - Example: { id, firstName, lastName, centerId, mobilePhone, ... }

- guest:updated
  - Payload: The updated guest document.
  - Example: { id, firstName, lastName, centerId, ... }

- guest:deleted
  - Payload: { id: string }

- center:updated
  - Payload: Partial center info (at minimum id, availableCapacity, currentGuests). We may also send the full center document on create/update.
  - Example: { id, availableCapacity, currentGuests, totalCapacity?, lastUpdated? }

- center:deleted
  - Payload: { id: string }

Client expectations
- Connect to the backend Socket.IO server at the same origin as the API (e.g. http://localhost:4000).
- Listen for the above events to get real-time updates. Example (client-side):

  const socket = io(BACKEND_URL);
  socket.on('guest:created', guest => { /* add guest to state */ });
  socket.on('guest:updated', guest => { /* update guest in state */ });
  socket.on('guest:deleted', ({ id }) => { /* remove guest */ });
  socket.on('center:updated', center => { /* update center */ });

Notes
- Events are broadcast to all connected clients. If you need room-based or role-based filtering (government only, center staff only), we can add join/leave logic using socket rooms and emit to specific rooms.
- If you need authentication for socket connections, we can implement a token handshake: client sends the JWT in the auth payload when connecting, and server validates it before subscribing.
