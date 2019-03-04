# Use Cases

## Use-Case: publishFahrzeug
	1) Lege vehicleChannel(RAAM) an -> Pubn
	2) Erste Nachricht (Index=0) mit Addresse zu metainfoChannel(MAM) über das Fahrzeug

## Use-Case: fahrzeugAnPositionEinloggen/Registrieren
	1) fahrtChannel anlegen
		a. Root tripChanneli(RAAM)
		b. Welcome Message an Index 0:
			i. Addresse zum bezahlen
			ii. Preis
			iii. Nonce for authentication
			iv. Reservierungsgebühr/min
		c. Root von tripChanneli in  vehicleChannel an nächsten freien Indexi
		d. Schreibe Pubn + Indexi

## Use-Case: Reservierung
	1) Siehe Fahrt 1 + 2
	2) Nutzer bezahlt Reservierungsgebühr + encryptedNonce zur Authentifizierung
	3) Fahrzeug beobachtet Adresse für Reservierung
	4) Fahrzeug speichert und veröffentlicht Reservierung

## Use-Case: Fahrt
	1) Nutzer sucht Adresse von Abfahrtsort
	2) Nutzer prüft Verfügbare Fahrzeuge 
		a. Bekommt Metainfo aus welcome message
		b. Ist Fahrzeug abgefahren, ja -> breche ab
		c. Ist Fahrzeug reseviert?
			i. Ja -> Fahrzeug verlangt Authentifizierung: secret das nonce verschlüsselt hat
			ii. Nein -> öffne Tür
	3) Nutzer steigt in Fahrzeug und tätigt Bezahlung 
		a. Nutzer sendet Fahrzeug gewünschtes ziel
		b. Fahrzeug sendet maximalen preis
		c. Nutzer und Fahrzeug öffnen bezahlungschannel
			i. Erstellen multisig adresse
			ii. Zahlen maximalen preis auf multisig adresse ein
			iii. Nutzer sendet erste Microtransaction für Fahrt
	4) Fahrzeug registriert Abfahrt
	5) Fahrzeug beendet Fahrt
    6) Fahrzeug meldet sich bei Ankunftsort an
    
