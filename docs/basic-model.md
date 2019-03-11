# Models

## VehicleChannel
 - RAAM channel mit beliebiger Höhe
 - channelId = vehicleId
 - Index 0: MetaInfoReference
 - Index 1-n: WelcomeMessages
  
### MetaInfoReference
 - Root zu MetaInfoChannel

### WelcomeMessage:
- Props:
  - Root von tripChannel<sub>i</sub> (in nextRoot)
  - txHash
- optional verschlüsselt mit Passwort, wenn es nicht möglich sein soll, diese Fahrt zu lesen, wenn man die CheckInMessage nicht kennt -> Fahrzeug kann seinen Fahrtverlauf geheim halten
- Nachricht dient dazu Assoziation zwischen CheckInMessage und vehicle zu verifizieren

## Haltestellen-Adresse
  - Transaktionen: CheckInMessages

### CheckInMessage
- Props:
  - vehicleId
  - Verweis auf WelcomeMessage für tripChannel<sub>i</sub> (Index j)
  - Bezahladresse
  - Preis
  - Reservierungsgebühr/min
  - Root zum reservationChannel (MAM)
  - optional: Selbstbeschreibung des Fahrzeugs
  - optional: Passwort für WelcomeMessage
- Message wird referenziert über txHash

## TripChannel:
- Länge = 2
- Messages:
  - Index 0: Goodbye message
  - Index 1: ungenutzt, Puffer
  
### GoodbyeMessage:
- Object

## ReservationChannel:
- Type: MAM

### ReservationChannelMessage:
- Object
  - dueTimestamp
  - hash(nonce)
