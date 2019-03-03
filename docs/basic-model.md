# Models

## tripChannel:
	- Länge = 4
		a. Welcome message
		b. Reservations-reference
		c. Goodbye message
		d. puffer

## welcomeMessage:
	- Object
		a. Addresse zum bezahlen
		b. Preis
		c. Nonce for authentication
		d. Reservierungsgebühr/min
	- 

## goodbyeMessage:
	- Object
		○ 

## reservationReference:
	- Object
		○ Root zum reservationChannel

## reservationChannel:
	- Type: MAM

## reservationChannelMessage:
	- Object
		○ dueTimestamp
		○ encryptedNonce
