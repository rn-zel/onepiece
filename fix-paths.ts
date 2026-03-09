import { Project } from "ts-morph";
import * as path from "path";
import * as fs from "fs";

async function main() {
    const project = new Project({
        tsConfigFilePath: "./tsconfig.json",
    });

    const moves = [
        // Source -> Target
        { from: "src/types/src/domain/models/GameTypes.ts", to: "src/domain/models/GameTypes.ts" },
        { from: "src/src/domain/entities/Reel.ts", to: "src/domain/entities/Reel.ts" },
        { from: "src/src/domain/constants/Config.ts", to: "src/domain/constants/Config.ts" },
        
        { from: "src/services/src/application/orchestrators/CascadeOrchestrator.ts", to: "src/application/orchestrators/CascadeOrchestrator.ts" },
        { from: "src/services/src/application/orchestrators/SpinOrchestrator.ts", to: "src/application/orchestrators/SpinOrchestrator.ts" },
        { from: "src/api/src/infrastructure/api/slotApi.ts", to: "src/infrastructure/api/slotApi.ts" },
        { from: "src/src/infrastructure/audio/SoundManager.ts", to: "src/infrastructure/audio/SoundManager.ts" },
        
        { from: "src/src/presentation/ui/UIManager.ts", to: "src/presentation/ui/UIManager.ts" },
        { from: "src/ui/src/presentation/ui/WinPresenter.ts", to: "src/presentation/ui/WinPresenter.ts" },
        { from: "src/ui/src/presentation/ui/BuyFreeSpinsModal.ts", to: "src/presentation/ui/BuyFreeSpinsModal.ts" },
        { from: "src/ui/src/presentation/ui/lefttop.ts", to: "src/presentation/ui/lefttop.ts" },
        { from: "src/ui/src/presentation/ui/top.ts", to: "src/presentation/ui/top.ts" },
        { from: "src/ui/src/presentation/ui/title.ts", to: "src/presentation/ui/title.ts" },
        { from: "src/ui/src/presentation/ui/model.ts", to: "src/presentation/ui/model.ts" },
        
        { from: "src/src/presentation/vfx/VFXManager.ts", to: "src/presentation/vfx/VFXManager.ts" },
        { from: "src/services/src/presentation/vfx/ParticleEmitter.ts", to: "src/presentation/vfx/ParticleEmitter.ts" },
        
        { from: "src/animation/src/presentation/animation/LightningBorder.ts", to: "src/presentation/animation/LightningBorder.ts" },
        { from: "src/animation/src/presentation/animation/WaterBg.ts", to: "src/presentation/animation/WaterBg.ts" },
        { from: "src/src/presentation/animation/Starfield.ts", to: "src/presentation/animation/Starfield.ts" },
        
        // Wait, SymbolAnimation and SymbolAnimator! Let's put them together.
        { from: "src/services/src/presentation/animation/SymbolAnimation.ts", to: "src/presentation/animation/SymbolAnimation.ts" },
        { from: "src/services/SymbolAnimator.ts", to: "src/presentation/animation/SymbolAnimator.ts" }
    ];

    for (const move of moves) {
        const absFrom = path.resolve(process.cwd(), move.from);
        const absTo = path.resolve(process.cwd(), move.to);
        
        const sf = project.getSourceFile(absFrom);
        if (sf) {
             console.log(`Moving ${move.from} to ${move.to}`);
             sf.move(absTo);
        } else {
             console.warn(`Could not find ${move.from}`);
        }
    }

    console.log("Saving project...");
    await project.save();
    console.log("Ast transform done.");
}

main().catch(console.error);
