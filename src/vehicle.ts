export default interface Vehicle {
    start(): void

    stop(): void

    setSpeed(speed: number): void

    getSpeed(): number
}