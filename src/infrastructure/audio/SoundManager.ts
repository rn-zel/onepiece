import { sound } from '@pixi/sound';

export class SoundManager {
    private currentBGM: string | null = null;
    private pendingBGM: boolean | null = null; // null = not requested yet
    private audioUnlocked = false;

    private readonly tracks = {
        bgm_normal: {url: 'sounds/bg1.mp3', volume: 5},
        bgm_free: {url: 'sounds/phonk.mp3', volume: 4},     
        sfx_spin: {url: 'sounds/spin.mp3', volume: 8},
        sfx_win: {url: 'sounds/win.mp3', volume: 10},
        sfx_vortex: {url: 'sounds/vortex.mp3', volume: 5},
        sfx_impact: {url: 'sounds/boom.mp3', volume: 20},
        sfx_maxwin: {url: 'sounds/bonusspin.mp3', volume: 5},
        sfx_totalwin: {url: 'sounds/totalwin.mp3', volume: 10},
        sfx_thunder: {url: 'sounds/thunder.mp3', volume: 3},

      
        sfx_break: {url: 'sounds/break.mp3', volume: 8},
        sfx_coin: {url: 'sounds/coin.mp3', volume: 4}, 
        sfx_button: {url: 'sounds/button.mp3', volume: 7},
        sfx_buy: {url: 'sounds/buy.mp3', volume: 10},
        sfx_bet: {url: 'sounds/fah.mp3', volume: 7},
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

        // Unlock audio on the first user gesture — required by browsers
        const unlock = () => {
            if (this.audioUnlocked) return;
            this.audioUnlocked = true;
            document.removeEventListener('click', unlock);
            document.removeEventListener('touchstart', unlock);
            document.removeEventListener('keydown', unlock);

            // Play the BGM that was requested before the gesture
            if (this.pendingBGM !== null) {
                this._startBGM(this.pendingBGM);
                this.pendingBGM = null;
            }
        };
        document.addEventListener('click', unlock);
        document.addEventListener('touchstart', unlock);
        document.addEventListener('keydown', unlock);
    }

    public playBGM(isFreeSpin: boolean) {
        if (!this.audioUnlocked) {
            // Store intent — will be played once audio is unlocked
            this.pendingBGM = isFreeSpin;
            return;
        }
        this._startBGM(isFreeSpin);
    }

    private _startBGM(isFreeSpin: boolean) {
        const nextBGM = isFreeSpin ? 'bgm_free' : 'bgm_normal';
        if (this.currentBGM === nextBGM) return;

        if (this.currentBGM) {
            sound.stop(this.currentBGM);
        }

        sound.play(nextBGM, { loop: true });
        this.currentBGM = nextBGM;
    }

    public playSFX(alias: keyof typeof this.tracks) {
        if (!this.audioUnlocked) return; // Skip SFX before first gesture too
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
