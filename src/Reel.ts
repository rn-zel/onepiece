import { Container, Sprite, Texture, BlurFilter } from "pixi.js";
import { CONFIG } from "./Config";

export class Reel {
  container: Container;
  symbols: Sprite[] = [];
  position: number = 0;
  blur: BlurFilter = new BlurFilter();
  symbolsPerReel: number;
  slotTextures: Texture[];
  symbolSize: number;
  symbolSpacing: number;
  cardWidth: number;
  cardHeight: number;
  symbolContainer: Container;
  isFreeSpins: boolean = false;

  constructor(
    container: Container,
    textures: Texture[],
    symbolsPerReel: number,
    symbolSize: number,
    symbolSpacing: number,
    cardWidth: number,
    cardHeight: number
  ) {
    this.container = container;
    this.slotTextures = textures;
    this.symbolsPerReel = symbolsPerReel;
    this.symbolSize = symbolSize;
    this.symbolSpacing = symbolSpacing;
    this.cardWidth = cardWidth;
    this.cardHeight = cardHeight;
    this.symbolContainer = new Container();

    this.initSymbols();
    this.container.addChild(this.symbolContainer);
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
              const availableWidth = this.cardWidth - (CONFIG.SYMBOL_MARGIN * 2);
              const scale = Math.min(availableWidth / s.texture.width, (this.symbolSize) / s.texture.height);
              s.scale.set(scale);
              (s as any).baseScale = scale; 
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
      
      const availableWidth = this.cardWidth - (CONFIG.SYMBOL_MARGIN * 2);
      const scale = Math.min(availableWidth / symbol.width, (this.symbolSize) / symbol.height);
      
      symbol.scale.set(scale);
      symbol.anchor.set(0.5, 0); 
      symbol.x = this.cardWidth / 2; 
      
      (symbol as any).baseScale = scale; 
      (symbol as any).lap = 0; 
      
      this.symbols.push(symbol);
      this.symbolContainer.addChild(symbol);
    }
  }

  updateSymbols() {
    const symbolHeight = this.symbolSize + this.symbolSpacing;
    const max = this.symbols.length;
    
    this.symbols.forEach((s, j) => {
      const relativePos = (((this.position + j) % max) + max) % max;
      s.y = Math.round((relativePos - 1) * symbolHeight);
      
      const currentLap = Math.floor((this.position + j) / max);
      
      if ((s as any).lap !== currentLap) {
        s.texture = this.randomTexture();
        const availableWidth = this.cardWidth - (CONFIG.SYMBOL_MARGIN * 2);
        const scale = Math.min(availableWidth / s.texture.width, (this.symbolSize) / s.texture.height);
        s.scale.set(scale);
        (s as any).baseScale = scale; 
        (s as any).lap = currentLap; 
      }
    });
  }

  getSymbolAtRow(row: number): Sprite {
    const targetY = row * (this.symbolSize + this.symbolSpacing);
    const found = this.symbols.find(s => Math.abs(s.y - targetY) < 50);
    return found || this.symbols[0];
  }

  getSymbolTexture(row: number): Texture {
    return this.getSymbolAtRow(row).texture;
  }
  
  setBrightness(row: number, brightness: number) {
      const symbol = this.getSymbolAtRow(row);
      const baseScale = (symbol as any).baseScale || 1;

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
          const baseScale = (s as any).baseScale || 1;
          s.scale.set(baseScale);
      });
  }
}