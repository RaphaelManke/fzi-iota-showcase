import Vehicle from "./vehicle";

export default interface Environment {
    addVehicle(v: Vehicle, x: number, y: number): void

    addMarker(id: string, x: number, y: number): void

    getVehicle(id: string): Vehicle | undefined
}