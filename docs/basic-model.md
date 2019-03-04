# Models

## tripChannel:
- Länge = 4
- Props:
  - Welcome message
  - Reservations-reference
  - Goodbye message
  - puffer

## welcomeMessage:
- Props:
  - Addresse zum bezahlen
  - Preis
  - Nonce for authentication
  - Reservierungsgebühr/min

## goodbyeMessage:
- Object

## reservationReference:
- Props:
  - Root zum reservationChannel

## reservationChannel:
- Type: MAM

## reservationChannelMessage:
- Object
  - dueTimestamp
  - hash(encryptedNonce)
