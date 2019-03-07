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
  - Reservierungsgebühr/min
  - Haltestellen-Id

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
  - hash(nonce)
