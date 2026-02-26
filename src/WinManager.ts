import { Texture } from "pixi.js";
import { PAYOUTS, PAYLINES } from "./Config";
import type { Reel } from "./Reel";

export class WinManager {
    private slotTextures: Texture[];

    constructor(slotTextures: Texture[]) {
        this.slotTextures = slotTextures;
    }

    getSymbolType(texture: Texture): string {
        const index = this.slotTextures.indexOf(texture);
        if (index >= 0 && index <= 4) return 'LOW'; 
        if (index >= 5 && index <= 7) return 'HIGH'; 
        if (index === 8) return 'WILD'; 
        if (index === 9) return 'SCATTER'; 
        return 'UNKNOWN';
    }

    countScatters(reels: Reel[]): number {
        let count = 0;
        for (let r = 0; r < reels.length; r++) {
            for (let row = 0; row < 3; row++) {
                 const texture = reels[r].getSymbolTexture(row);
                 if (this.getSymbolType(texture) === 'SCATTER') {
                     count++;
                 }
            }
        }
        return count;
    }

    checkPaylineWins(reels: Reel[], betAmount: number) {
        const wins: any[] = [];
        const WILD_INDEX = 8;     
        const SCATTER_INDEX = 9;  

        PAYLINES.forEach((line, lineIndex) => {
            const symbols = [
                this.slotTextures.indexOf(reels[0].getSymbolTexture(line[0])),
                this.slotTextures.indexOf(reels[1].getSymbolTexture(line[1])),
                this.slotTextures.indexOf(reels[2].getSymbolTexture(line[2])),
                this.slotTextures.indexOf(reels[3].getSymbolTexture(line[3])),
                this.slotTextures.indexOf(reels[4].getSymbolTexture(line[4]))
            ];

            let bestWinForLine = { payout: 0, isJackpot: false, matchLength: 0, startIndex: 0 };

            for (let start = 0; start <= 2; start++) {
                 let targetIndex = symbols[start];
                 let matchLength = 1;

                 if (targetIndex === WILD_INDEX) {
                     if (start === 0 && 
                         symbols[1] === WILD_INDEX && 
                         symbols[2] === WILD_INDEX && 
                         symbols[3] === WILD_INDEX && 
                         symbols[4] === WILD_INDEX) {
                              wins.push({ lineIndex, payout: betAmount * PAYOUTS.JACKPOT, isJackpot: true, matchLength: 5, startIndex: 0 });
                              return; 
                     }
                     
                     for(let k = start + 1; k < 5; k++) {
                         if (symbols[k] !== WILD_INDEX) {
                             targetIndex = symbols[k];
                             break;
                         }
                     }
                 }

                 if (targetIndex === SCATTER_INDEX) continue; 

                 for (let next = start + 1; next < 5; next++) {
                     if (symbols[next] === targetIndex || symbols[next] === WILD_INDEX) {
                         matchLength++;
                     } else {
                         break; 
                     }
                 }

                 if (matchLength >= 3) {
                     let multiplier = 0;
                     const type = this.getSymbolType(this.slotTextures[targetIndex]);
                     let basePay = (type === 'HIGH') ? PAYOUTS.HIGH : PAYOUTS.LOW;

                     if (matchLength === 3) multiplier = basePay;
                     if (matchLength === 4) multiplier = basePay * PAYOUTS.MULTI_4;
                     if (matchLength === 5) multiplier = basePay * PAYOUTS.MULTI_5;

                     const payout = betAmount * multiplier;
                     
                     if (payout > bestWinForLine.payout) {
                         bestWinForLine = { payout, isJackpot: false, matchLength: matchLength, startIndex: start };
                     }
                 }
            }

            if (bestWinForLine.payout > 0) {
                wins.push({ 
                    lineIndex, 
                    payout: bestWinForLine.payout, 
                    isJackpot: bestWinForLine.isJackpot,
                    matchLength: bestWinForLine.matchLength,
                    startIndex: bestWinForLine.startIndex 
                });
            }
        });
        return wins;
    }
}