# Eventtypes
## CheckIn
- stopId
- vehicleId

## Login
- userId
- name
- position
- balance

## ReservationIssued
- userId
- vehicleId
- validUntil

## ReservationExpired
- userId
- vehicleId

## BoardingStarted
- userId
- vehicleId
- destination

## TripStarted
- userId
- vehicleId

## TripFinished
- userId
- vehicleId

## PosUpdated
- userId/vehicleId

## TransactionIssued
- from
- to
- amount

## Logout
- userId

# Endpunkte
## GET /env
- stops
  - id
  - name
  - lng
  - lat
- connections
  - type
  - from 
  - to
  - path
- vehicles
  - info
    - speed
    - co2emission
    - type
  - name
  - id
  - position
    - lng
    - lat
  - checkIn: {stopId} | undefined
  - trip: {userId, destination} | undefined
  - balance
- users
  - id
  - name
  - position
    - lng
    - lat
  - balance