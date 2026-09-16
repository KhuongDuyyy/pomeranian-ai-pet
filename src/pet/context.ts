export interface Context { ownerPresent: boolean; ownerJustArrived: boolean; foodAvailable: boolean; toyAvailable: boolean; loudNoise: boolean; isNight: boolean }
export const defaultContext: Readonly<Context> = Object.freeze({ ownerPresent: true, ownerJustArrived: false, foodAvailable: false, toyAvailable: true, loudNoise: false, isNight: false });
