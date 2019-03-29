# Use Cases

## Use-Case: publishFahrzeug

1. Fahrzeug legt vehicleChannel (RAAM) an -> Pub<sub>n</sub> = vehicleId
2. Fahrzeug erzeugt Root von metaInfoChannel (MAM) für das Fahrzeug
3. Fahrzeug schreibt erste Nachricht (Index=0) mit Root zu metaInfoChannel in vehicleChannel
4. Fahrzeug schreibt Selbstbeschreibung in erste Nachricht von MetaInfoChannel

## Use-Case: fahrzeugAnPositionEinloggen/Registrieren

- Fahrzeug legt tripChannel i an
  1. Ereugt channelId von tripChannel<sub>i</sub> (RAAM)
  2. Findet nächsten freien Index j in vehicleChannel
  3. berechnet Root zum reservationChannel
  4. Legt nächste Bezahladresse fest
  5. Startet Beobachtung für Bezahladresse
  6. Schreibt CheckInMessage an Adresse von Haltestelle: -> txHash
     - vehicleId
     - Verweis auf WelcomeMessage für tripChannel<sub>i</sub> (Index j)
     - Bezahladresse
     - Preis
     - Reservierungsgebühr/min
     - Root zum reservationChannel (MAM)
     - hashedNonce zur Authentifizierung
     - optional: Selbstbeschreibung des Fahrzeugs
     - optional: Passwort für WelcomeMessage
  7. Schreibt WelcomeMessage in vehicleChannel an Index j:
     - channelId von tripChannel<sub>i</sub> (in nextRoot)
     - txHash

## Use-Case: Fahrt

1. Nutzer fragt Adresse von Abfahrtsort ab
2. Nutzer prüft CheckInMessages aller Fahrzeuge:
   1. Liest Bedingungen der Fahrt aus CheckInMessage
   2. Liest, wenn verfügbar, Selbstbeschreibung aus CheckInMessage
      - wenn Information nicht ausreichend: lese MetaInfoChannel des Fahrzeugs
   3. wenn Fahrzeug nicht genutzt werden soll -> prüfe nächste CheckInMessage
   4. prüfe Assoziation der CheckInMessage mit Fahrzeug durch lesen der WelcomeMessage
      - Verifikation schlägt fehl -> prüfe nächste CheckInMessage
   5. lese tripChannel aus
   6. Ist Fahrzeug abgefahren? ja -> breche ab
   7. Ist Fahrzeug ausgebucht? ja -> breche ab
3. Nutzer öffnet Kommunikationskanal mit Fahrzeug
   1. Fahrzeug authentifiziert sich mit nonce
   2. Ist Fahrzeug von Nutzer reseviert?
      - Ja -> Fahrzeug verlangt Authentifizierung: Nutzer sendet nonce
   3. Nutzer sendet Fahrzeug gewünschtes ziel
   4. Fahrzeug sendet maximalen preis
   5. Konditionen werden nicht von beiden akzeptiert -> breche ab
   6. Nutzer und Fahrzeug öffnen Bezahlkanal
      1. Erstellen multisig adresse
      2. Zahlen maximalen preis auf multisig adresse ein
      3. Nutzer sendet erste Microtransaction für Fahrt
4. Fahrzeug öffnet Tür und registriert Abfahrt in tripChannel
5. Microtransactions (3.6.3) werden solange wiederholt, bis Fahrt beendet ist
6. Fahrzeug beendet Fahrt
7. Fahrzeug meldet sich bei Ankunftsort an

## Use-Case: Reservierung

1. Siehe Fahrt 1.-2.7.
2. Nutzer bezahlt Reservierungsgebühr
   - Transaktion enthält Nachricht:
     - hash(nonce) zur Authentifizierung
     - Zeitpunkt, bis zu dem reserviert werden soll
     - repaymentAddress falls Reservierung nicht angenommen wird
3. Fahrzeug empfängt Reservierung auf beobachteter Adresse
4. Fahrzeug speichert und veröffentlicht Reservierung
