export default interface Mock {
    markerDetected(id: string): void

    rfidDetected(id: string): void

    rfidRemoved(): void
    
    getId(): string
}