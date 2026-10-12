# Veritas Life: asset and licence manifest

Everything the game loads is stored in this repository (no hot-linked models or textures).

## People (`vendor/hm/`, built by `tools/humans/build-humans.js`)
| Asset | Source | Licence | Used for | Changes |
|---|---|---|---|---|
| Base mesh `base.obj`, skeleton `default.mhskel`, skin weights, body targets (ethnic, weight, muscle, height, proportions, breast, face shapes) | MakeHuman 1.x data, https://github.com/makehumancommunity/makehuman | CC0 1.0 | Every character's body, rig and shape | Packed into `hm.bin`; 20-bone game skeleton; clothes shells subdivided once |
| Facial expression units (eye closure L/R, mouth corner puller, mouth open, mouth depression, eyebrows up/down; African set) | MakeHuman 1.x `targets/expression/units/african` | CC0 1.0 | Blinking, smiles, talking, frowns, raised/lowered brows | Packed into `hm.bin`; brows combined L+R |
| High-poly eyes + `eye.png` | MakeHuman 1.x data | CC0 1.0 | Eyes | Fitted with the mhclo refs |
| Skins `young_african_male`, `young_african_female` (`skin_m.jpg`, `skin_f.jpg`) | MakeHuman system assets, https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html | CC0 1.0 | Skin colour and detail | Resized to 1024 px JPEG |
| Hair `afro01`, `braid01`, `ponytail01`, `bob01`, `short02` | MakeHuman system assets (same pack) | CC0 1.0 | Hairstyles | Diffuse resized to 512 px |
| Eyebrows `eyebrow001`, eyelashes `eyelashes01` | MakeHuman system assets (same pack) | CC0 1.0 | Brows and lashes | Resized to 256 px |
| Walk, run, idle motion (`clips.json`) | Animations of `Xbot.glb` from the three.js examples (https://github.com/mrdoob/three.js/tree/r128/examples/models/gltf), originally Mixamo | Shipped with three.js (MIT repo), but the motion itself is Mixamo's: free to use inside games under Adobe's Mixamo terms, which do not allow sharing the animation files on their own. `clips.json` sits in a public repo, so check those terms or replace it with your own captures | Character locomotion | Converted to rotation tracks and retargeted to the game skeleton |

## Ground and roof textures (`vendor/tex/`)
All from Poly Haven (https://polyhaven.com), CC0 1.0, resized to 512 px:
`asphalt_02`, `leafy_grass`, `concrete_pavers`, `concrete_floor_02`, `dry_ground_01`, `corrugated_iron_02`.

## Code
| Library | Licence |
|---|---|
| three.js r128 (`vendor/three.min.js`) | MIT |

## Generated in code (no external files)
Sky, clouds, leaf cards, clothing fabric patterns (cotton, twill, knit, leather), furniture, flower beds, vehicles, buildings.
The car front-detail idea (grille bars, badge, lamp inserts, lip, sensors) and the entrance lamps/sign bands came from a ChatGPT pass on this code; they are original geometry.

## Places and names that are estimates
- **Blocks A–D, Munch Box, Down Cafe:** positions and colours are estimates (Blocks A–D in a row by the lecture area, Down Cafe beside the Boys Hostel). Public map data only lists the cafeteria, multipurpose hall, auditorium and chaplaincy, so these need checking against photos of the real campus.
- **Concert artists:** the default lineup (Kezzy B, Starlight Wizz, Afro Giant) is made up. The admin can type any lineup; using real artists' names or likenesses needs their permission.
- **Concert music:** generated in the browser (drums, log drum, chords); no recordings are used.

## Not used (and why)
Sketchfab, CGTrader, BlenderKit, Rokoko: need an account/login and per-asset licence checks, and the build machine cannot reach them. Nothing from them is in this repository.
