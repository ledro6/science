# ep35 readiness

- TTS + WordBoundary timeline complete: Svetlana +8%, 52.18 s
- Primary paper (Audoly & Neukirch, 2005) read; claim mapping and model caveats in SOURCES.md
- Five original procedural 3D scenes, two light and three dark; no stock footage
- 17 final control stills captured without PAGE/CONSOLE/RENDER errors; phone-size contact sheet visually inspected
- Early bend cropping corrected; delayed first wave title corrected; cylinder internal caps removed to avoid visible joint seams
- Verified TikTok cover at 2160×3840; phone preview inspected
- 1.5 s break-motion check rendered at 1440×2560, 60 fps; ffprobe and full decode successful; six-frame motion strip inspected for deterministic placement and gradual fragment separation
- Runtime cache checks: changed=0 in final scene checks; 34 cache hits, 56 renders for break fragment
- SFX JSON and SRT prepared

Remaining for coordinator: full master render and audiovisual review; narration has not been listened to here, so names/pronunciation remain subject to that listening pass. No real-device check performed. Final complete video not rendered by episode agent.

Best frames: `stills/ep35-final_t5.80.png`, `stills/ep35-final_t15.90.png`, `stills/ep35-final_t29.50.png`, `stills/ep35-final_t34.50.png`, `stills/ep35-final_t49.50.png`

Covers: `ep35-tiktok-cover.png`; source `cover.json` / `hero.mjs`. Isolated helper `capture-cover.cjs` intercepts the episode index only for its local capture, preserving the shared index and brand output directory.
