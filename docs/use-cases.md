# Use Cases

## Use-Case: publishFahrzeug
1. Fahrzeug legt vehicleChannel (RAAM) an -> Pub<sub>n</sub>
2. Fahrzeug erzeugt Root von metaInfoChannel (MAM) für das Fahrzeug
3. Fahrzeug schreibt erste Nachricht (Index=0) mit Root zu metainfoChannel in vehicleChannel

## Use-Case: fahrzeugAnPositionEinloggen/Registrieren
- Fahrzeug legt tripChannel i an
   1. Ereugt Root von tripChannel<sub>i</sub> (RAAM)
   2. Schreibt WelcomeMessage an Index 0 in tripChannel<sub>i</sub>:
		- Addresse zum Bezahlen
		- Preis
        - Reservierungsgebühr/min
   3. Beobachtet Adresse für Reservierung
   4. Schreibt Root von tripChannel<sub>i</sub> in vehicleChannel an nächsten freien Index i
   5. Schreibt Pub<sub>n</sub> + Index i an Adresse von Position

## Use-Case: Fahrt
1. Nutzer sucht Adresse von Abfahrtsort
2. Nutzer prüft Verfügbare Fahrzeuge 
	1. Liest Metainfo aus welcome message der tripChannels
	2. Ist Fahrzeug abgefahren? ja -> breche ab
	3. Ist Fahrzeug reseviert?
		1. Ja -> Fahrzeug verlangt Authentifizierung: Nutzer sendet nonce
		2. Nein -> öffne Tür
3. Nutzer steigt in Fahrzeug und tätigt Bezahlung 
	1. Nutzer sendet Fahrzeug gewünschtes ziel
	2. Fahrzeug sendet maximalen preis
	3. Nutzer und Fahrzeug öffnen bezahlungschannel
		1. Erstellen multisig adresse
		2. Zahlen maximalen preis auf multisig adresse ein
		3. Nutzer sendet erste Microtransaction für Fahrt
4. Fahrzeug registriert Abfahrt in tripChannel
5. Microtransactions (3.3.3) werden solange wiederholt, bis Fahrt beendet ist
6. Fahrzeug beendet Fahrt
7. Fahrzeug meldet sich bei Ankunftsort an
    
## Use-Case: Reservierung
1. Siehe Fahrt 1.-2.3.
   - ist Fahrzeug reserviert/ausgebucht? ja -> breche ab
2. Nutzer bezahlt Reservierungsgebühr
   - Transaktion enthält Nachricht:
     - hash(nonce) zur Authentifizierung
     - Zeitpunkt, bis zu dem reserviert werden soll
3. Fahrzeug empfängt Reservierung auf beobachteter Adresse
4. Fahrzeug speichert und veröffentlicht Reservierung