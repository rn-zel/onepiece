import { Container, Sprite, Texture, BlurFilter } from "pixi.js";
import type { SymbolSprite } from "../models/GameTypes";

export class Reel {
  container: Container;
  symbols: Sprite[] = [];
  position: number = 0;
  blur: BlurFilter = new BlurFilter({ strengthX: 0, strengthY: 0 });
  symbolsPerReel: number;
  slotTextures: Texture[];
  symbolSize: number;
  symbolSpacing: number;
  cardWidth: number;
  cardHeight: number;
  symbolMargin: number;
  symbolContainer: Container;
  isFreeSpins: boolean = false;
  targetPosition: number = -1;
  finalGrid: number[] | null = null;

  setSpriteToSymbolIndex(symbol: Sprite, symbolIndex: number) {
      if (symbolIndex === undefined || symbolIndex < 0) return;
      const texture = this.slotTextures[symbolIndex];
      if (!texture) return;

      symbol.texture = texture;
      const availableWidth = this.cardWidth - (this.symbolMargin * 2);
      const scale = Math.min(availableWidth / texture.width, this.symbolSize / texture.height);
      symbol.scale.set(scale);
      (symbol as unknown as SymbolSprite).baseScale = scale;
      symbol.alpha = 1;
      symbol.rotation = 0;
  }

  constructor(
    container: Container,
    textures: Texture[],
    symbolsPerReel: number,
    symbolSize: number,
    symbolSpacing: number,
    cardWidth: number,
    cardHeight: number,
    symbolMargin: number = 20
  ) {
    this.container = container;
    this.slotTextures = textures;
    this.symbolsPerReel = symbolsPerReel;
    this.symbolSize = symbolSize;
    this.symbolSpacing = symbolSpacing;
    this.cardWidth = cardWidth;
    this.cardHeight = cardHeight;
    this.symbolMargin = symbolMargin;
    this.symbolContainer = new Container();

    this.initSymbols();
    this.symbolContainer.filters = [this.blur];
    this.container.addChild(this.symbolContainer);
  }

  public updateConfig(symbolSize: number, symbolSpacing: number, cardWidth: number, cardHeight: number, symbolMargin: number) {
    this.symbolSize = symbolSize;
    this.symbolSpacing = symbolSpacing;
    this.cardWidth = cardWidth;
    this.cardHeight = cardHeight;
    this.symbolMargin = symbolMargin;
    
    // Reposition and rescale existing symbols
    this.symbols.forEach((s) => {
        const texture = s.texture;
        const availableWidth = this.cardWidth - (this.symbolMargin * 2);
        const scale = Math.min(availableWidth / texture.width, this.symbolSize / texture.height);
        s.scale.set(scale);
        (s as unknown as SymbolSprite).baseScale = scale;
        s.x = this.cardWidth / 2;
    });
    
    this.updateSymbols(); // Reflow Y positions
  }

 randomTexture(): Texture {
    let validTextures = this.slotTextures;
    
    if (this.isFreeSpins) {
        validTextures = this.slotTextures.filter((_, index) => index !== 9);
    }
    
    return validTextures[Math.floor(Math.random() * validTextures.length)];
  }

  removeScattersInstantly() {
     
      this.symbols.forEach(s => {
          if (this.slotTextures.indexOf(s.texture) === 9) { 
              s.texture = this.randomTexture(); 
              
              // Recalculate scale safely
              const availableWidth = this.cardWidth - (this.symbolMargin * 2);
              const scale = Math.min(availableWidth / s.texture.width, (this.symbolSize) / s.texture.height);
              s.scale.set(scale);
              (s as unknown as SymbolSprite).baseScale = scale;
          }
      });
  }

  private initSymbols() {
    const totalSymbols = 5; 
    
    for (let j = 0; j < totalSymbols; j++) {
      const texture = this.randomTexture();
      const symbol = new Sprite(texture);
      
      const yPosition = (j - 1) * (this.symbolSize + this.symbolSpacing);
      symbol.y = yPosition;
      
      const availableWidth = this.cardWidth - (this.symbolMargin * 2);
      const scale = Math.min(availableWidth / symbol.width, (this.symbolSize) / symbol.height);
      
      symbol.scale.set(scale);
      symbol.anchor.set(0.5, 0); 
      symbol.x = this.cardWidth / 2; 
      
      (symbol as unknown as SymbolSprite).baseScale = scale;
      (symbol as unknown as SymbolSprite).lap = 0;
      
      this.symbols.push(symbol);
      this.symbolContainer.addChild(symbol);
    }
  }

  updateSymbols() {
    const symbolHeight = this.symbolSize + this.symbolSpacing;
    const max = this.symbols.length;
    
    this.symbols.forEach((s, j) => {
      const relativePos = (((this.position + j) % max) + max) % max;
      s.y = (relativePos - 1) * symbolHeight; // Remove Math.round to prevent jitter/snapping
      
      const currentLap = Math.floor((this.position + j) / max);
      
      if ((s as unknown as SymbolSprite).lap !== currentLap) {
       
        let primed = false;
        if (this.finalGrid && this.targetPosition > 0) {
            const symbolsRemaining = this.targetPosition - (this.position + j);
         
            const stopIndex = Math.round(symbolsRemaining);
            if (stopIndex >= 1 && stopIndex <= 3) {
                const rowIndex = stopIndex - 1;
                this.setSpriteToSymbolIndex(s, this.finalGrid[rowIndex]);
                primed = true;
            }
        }

        if (!primed) {
            s.texture = this.randomTexture();
            const availableWidth = this.cardWidth - (this.symbolMargin * 2);
            const scale = Math.min(availableWidth / s.texture.width, (this.symbolSize) / s.texture.height);
            s.scale.set(scale);
            (s as unknown as SymbolSprite).baseScale = scale;
        }

        (s as unknown as SymbolSprite).lap = currentLap;
      }
    });
  }

  
  forceSetGrid(indices: number[]) {
    const symbolHeight = this.symbolSize + this.symbolSpacing;
    

    const sortedSymbols = [...this.symbols].sort((a, b) => a.y - b.y);

    for (let row = 0; row < 3; row++) {
      const bestSprite = sortedSymbols[row + 1];
      const targetY = row * symbolHeight;
      
      bestSprite.y = targetY; 
      this.setSpriteToSymbolIndex(bestSprite, indices[row]);
    }
  }

  getSymbolAtRow(row: number): Sprite {
    // Sort all symbols by their y-position to guarantee ordered array
    const sortedSymbols = [...this.symbols].sort((a, b) => a.y - b.y);
    // The visible rows start at index 1 from the sorted array
    return sortedSymbols[row + 1] || this.symbols[0];
  }

  getSymbolTexture(row: number): Texture {
    return this.getSymbolAtRow(row).texture;
  }

  setSymbolIndexAtRow(row: number, symbolIndex: number) {
    const symbol = this.getSymbolAtRow(row);
    this.setSpriteToSymbolIndex(symbol, symbolIndex);
  }
  
  setBrightness(row: number, brightness: number) {
      const symbol = this.getSymbolAtRow(row);
      const baseScale = (symbol as unknown as SymbolSprite).baseScale || 1;

      if (brightness < 1) {
          symbol.tint = 0x555555; 
          symbol.scale.set(baseScale); 
      } else {
          symbol.tint = 0xFFFFFF; 
          if(brightness > 1) {
              symbol.scale.set(baseScale * 1.15); 
          }
      }
  }
  
  resetBrightness() {
      this.symbols.forEach(s => {
          s.tint = 0xFFFFFF;
          const baseScale = (s as unknown as SymbolSprite).baseScale || 1;
          s.scale.set(baseScale);
      });
  }
}