import { sound } from '@pixi/sound';

export class SoundManager {
    private currentBGM: string | null = null;

    
    private readonly tracks = {
        bgm_normal: {url: 'sounds/bg1.mp3', volume: 5},
        bgm_free: {url: 'sounds/bg2.mp3', volume: 4},     
        sfx_spin: {url: 'sounds/spin.mp3', volume: 8},
        sfx_win: {url: 'sounds/win.mp3', volume: 3},
        sfx_vortex: {url: 'sounds/vortex.mp3', volume: 5},
        sfx_impact: {url: 'sounds/boom.mp3', volume: 20},
        sfx_maxwin: {url: 'sounds/bonusspin.mp3', volume: 5},
        sfx_totalwin: {url: 'sounds/totalwin.mp3', volume: 10},
        sfx_thunder: {url: 'sounds/thunder.mp3', volume: 1},
        
    };

    constructor() {
        
        sound.volumeAll = 1; 
    }

    public init() {
        for (const [key, track] of Object.entries(this.tracks)) {
            if (!sound.exists(key)) {
                sound.add(key, {
                    url: track.url,
                    volume: track.volume,
                    preload: true
                });
            }
        }
}
    

    public playBGM(isFreeSpin: boolean) {
        const nextBGM = isFreeSpin ? 'bgm_free' : 'bgm_normal';
        
        if (this.currentBGM === nextBGM) return;

        // Fade out  and fade in 
        if (this.currentBGM) {
            sound.stop(this.currentBGM);
        }

        sound.play(nextBGM, { loop: true });
        this.currentBGM = nextBGM;
    }

    public playSFX(alias: keyof typeof this.tracks) {
        sound.play(alias);
    }

    public stopSFX(alias: keyof typeof this.tracks) {
        if (sound.exists(alias)) {
            sound.stop(alias);
        }
    }

    public stopAll() {
        sound.stopAll();
    }
}