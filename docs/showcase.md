# Ziel 
Der Showcase soll zeigen, welche Probleme sich (nur) mit IOTA lösen lassen.

Wichtige Aspekte sind dabei:
1. die Anschaulichkeit des Showcases
2. die Relevanz, dass der Showcase dezentrale Technologien nutzt
3. die Relevanz, dass der Showcase Mikrotransaktionen nutzt

# Szenario
Menschen nutzen, um von einem Ort zum Anderen zu kommen, eine wachsende Anzahl verschiedener Verkehrsmittel, wie z.B. Fahrrad, Straßenbahn oder Auto. Dabei spielen verschiedene Faktoren wie Zeitaufwand, Preis oder CO<sub>2</sub>-Ausstoß eine Rolle. Immer häufiger werden die Verkehrsmittel nur für ebendiese Verbindungen geliehen und gehören nicht mehr den Fahrern selbst.

Allerdings ist dies zurzeit noch mit einem hohen Organisationsaufwand verbunden, da jedes Verkehrsmittel über ein anderes System gebucht werden muss. Desweiteren sind die Preismodelle wenig flexibel, sodass es sich z.B. nicht lohnt, nur eine sehr kurze Strecke zu fahren. Um das Nutzen verschiedener Verkehrsmittel attraktiv zu machen und den Vekehr effizienter zu machen, wird ein Leih- und Bezahlsystem (Ticketsystem) benötigt, das in der Lage ist, die Nutzung feingranular abzurechnen und Fahrten mit verschiedenen Verkehrsmitteln zu verwalten. Das System sollte möglichst vielen Teilnehmern offen stehen und für diese lukrativ sein, indem der Betreiber im besten Fall keine Gebühren verlangt.

## Technische Probleme
Ein Ticketsystem, dass Fahrten mit verschiedenen Verkehrsmitteln realisiert, birgt das Problem, dass sich die verschiedenen Anbieter von Verkehrsmitteln nicht per se vertrauen, sowohl untereinander als auch dem System selbst. Desweiteren muss das System in der Lage sein, Daten über angebotene Verkehrsmittel und gebuchte Fahrten geschützt vor Veränderung zu speichern und allen Teilnehmern anzuzeigen. Außerdem muss es möglich sein, die Fahrten sicher zu zahlen, sodass jeder Anbieter eines Verkehrsmittels korrekt vergütet wird.

## Lösungsansatz
Ein Ticketsystem, dass die genannten Probleme löst, kann mit IOTA realisiert werden. Die Verkehrsmittel könenn auf einem dezentralen Marktplatz angeboten werden, zu dem jeder Zugang hat. Sowohl angebotene Verkehrsmittel als auch gebuchte Fahrten werden im Tangle abgelegt, wo sie unveränderlich sind. Die Fahrten können feingranular, z.B. pro gefahrenenm Meter, als Mikrotransaktionen abgerechnet werden, da IOTA keine Transaktions-Gebühren verlangt.

# Showcase
Um das beschriebene Szenario minituarisiert zu demonstrieren, wird ein Showcase realisiert, der Interessenten ohne Vorwissen die Funktionsweise und Vorteile von IOTA veranschaulicht.

## Aufbau
Der Showcase ist einem Tisch aufgebaut, auf dem sich eine kreisförmige Fahrbahn befindet. Auf dieser können mehrere Autos, die die verschiedenen Verkehrsmittel darstellen, fahren. Desweiteren werden Lego-Figuren an die Gäste verteilt, mit denen man mit dem Showcase interagieren kann. Der Zustand des Showcases sowie etwaige Transaktionen auf dem IOTA Tangle werden auf einem Bildschirm angezeigt.

## Use Case
Ein Nutzer interagiert mit dem Showcase als Fahrer, das heißt, er möchte von einem Ort zum Anderen kommen und nutzt dabei ein bestimmtes Verkehrsmittel. 

1. Er setzt seine Lego-Figur auf eines der Fahrzeuge. Das Fahrzeug erkennt den Fahrer, der die erste Mikrotransaktion ausführt, um die Fahrt zu bezahlen. Dies wird auf dem Bildschirm angezeigt. 

2. Ist die Transaktion eingegangen, setzt sich das Fahrzeug in Bewegung. Während das Fahrzeug fährt, werden in regelmäßigen Abständen Mikrotransaktionen ausgeführt. Außerdem werden Preis, Geschwindigkeit und CO<sub>2</sub>-Verbrauch auf dem Bildschrim angezeigt.

3. Ist das Auto wieder am Ausgangspunkt angekommen, hält es an. Auf dem Bildschrim werden die Kontostände für das Auto und den Fahrer angezeigt.

Dies ist eine minimale Version eines möglichen Use Cases, der gegebenenfalls erweitert werden kann. 

## Technische Anforderungen
### Fahrbahn
- in sich geschlossen (z.B. kreisförmig)
- mehrspurig (Fahrzeuge müssen nebeneinander fahren können)

### mehrere Fahrzeuge
- müssen der Fahrbahn folgen können
- müssen anpassbare Geschwindigkeit haben
- müssen RFID-Daten lesen können
- müssen Schnittstelle zur automatisierten Steuerung (losfahren, anhalten, Geschwindigkeit anpassen) besitzen
- müssen Daten an Kontroll-Server senden können
- müssen Ablagestelle für Lego-Figur besitzen

### Lego-Figuren
- müssen RFID-Chips mit von einander unterscheidbaren Daten besitzen

### Kontroll-Server
- muss Fahrzeuge steuern können
- muss Lego-Figuren anhand von RFID-Daten Wallet zuordnen
- muss Wallets der Lego-Figuren und Fahrzeuge verwalten
- muss Eigenschaften der verschiedenen Fahrzeuge halten
- muss IOTA Transaktionen ausführen und beobachten können
- muss Zustand des Showcases (Preis, Geschwindigkeit der Fahrzeuge, ausgeführte Transaktionen) halten
- muss Zustand auf Web-Oberfläche darstellen können