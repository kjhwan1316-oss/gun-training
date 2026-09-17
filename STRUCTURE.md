# Architecture & Structure

```
neon-aim-trainer/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   └── AimTrainerApp.tsx     # Main 3D WebGL scene, game loop, HUD, modal management
│   │   ├── lib/
│   │   │   └── soundFX.ts           # Web Audio API procedural sound synthesizer
│   │   ├── App.tsx                  # Root mount
│   │   ├── index.css                # Tailwind styling tokens
│   │   └── main.tsx                 # Entry point
│   └── index.html                   # HTML template & viewport
├── ASSETS.md                        # Asset manifest
├── PLAN.md                          # Production plan & verification
└── package.json
```
