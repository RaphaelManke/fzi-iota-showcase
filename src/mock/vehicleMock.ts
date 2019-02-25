import Vehicle from '../vehicle'
import Mock from './mock'
import {EventEmitter2} from 'eventemitter2'


export default class VehicleMock implements Vehicle, Mock {
    private id: string
    private started = false
    private speed = 1 
    private events: EventEmitter2

    constructor(id: string, events: EventEmitter2) {
        this.id = id
        this.events = events
        
    }

    getId = () => this.id

    start() {
        if (!this.started) {
            this.events.emit('started', {id: this.id})
            this.started = true
        }
    }

    stop() {
        if (this.started) {
            this.events.emit('stopped', {id: this.id})
            this.started = false
        }
    }

    setSpeed(speed: number) {
        this.speed = speed
        this.events.emit('speedSet', {id: this.id, speed: this.speed})
    } 

    getSpeed = () => this.speed

    markerDetected = (id: string) => this.events.emit('markerDetected', {id: this.id, markerId: id})

    rfidDetected = (id: string) => this.events.emit('rfidDetected', {id: this.id, rfid: id})

    rfidRemoved = () => this.events.emit('rfidRemoved', {id: this.id})
}