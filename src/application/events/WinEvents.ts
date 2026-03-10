export type WinTier = "none" | "big" | "mega" | "max";

export type WinTierEventPayload = {
    tier: WinTier;
    totalWin: number;
    betAmount: number;
    isFreeSpins: boolean;
};

type Handler = (payload: WinTierEventPayload) => void;

/**
 * Simple application-level event emitter for win tiers.
 * SlotMachine publishes tiered wins; presentation and other
 * listeners can subscribe without tight coupling.
 */
export class WinEvents {
    private static listeners: Handler[] = [];

    static subscribe(handler: Handler): () => void {
        this.listeners.push(handler);
        return () => {
            this.listeners = this.listeners.filter((h) => h !== handler);
        };
    }

    static emit(payload: WinTierEventPayload): void {
        for (const handler of this.listeners) {
            handler(payload);
        }
    }
}

