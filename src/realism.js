/*
 * VERITAS LIFE — visual realism pass
 * Add this file as src/realism.js.
 *
 * This is a non-destructive enhancement layer for the existing Three.js game.
 * It preserves existing gameplay functions and does not replace the game world.
 * After adding it to src/, add "realism.js" to the end of the MODULES array
 * in build.js, then run: node build.js
 */
(function installVeritasRealism() {
  'use strict';

  if (window.__VERITAS_REALISM_INSTALLED__) return;
  window.__VERITAS_REALISM_INSTALLED__ = true;

  const THREE = window.THREE;
  if (!THREE) {
    console.warn('[VERITAS realism] Three.js was not found; visual pass skipped.');
    return;
  }

  const original = {};
  const clamp01 = (n) => Math.max(0, Math.min(1, n));

  function improveMaterial(material, kind) {
    if (!material || material.userData?.veritasRealism) return material;
    const m = material.clone ? material.clone() : material;
    if ('roughness' in m) {
      // Avoid the plastic/wet look: painted surfaces are not mirror-polished.
      if (kind === 'glass') {
        m.roughness = Math.max(0.16, Math.min(0.28, m.roughness ?? 0.22));
        if ('metalness' in m) m.metalness = Math.min(0.28, m.metalness ?? 0);
      } else if (kind === 'rubber') {
        m.roughness = 0.88;
        if ('metalness' in m) m.metalness = 0;
      } else {
        m.roughness = Math.max(0.48, Math.min(0.86, m.roughness ?? 0.68));
        if ('metalness' in m) m.metalness = Math.min(0.22, m.metalness ?? 0);
      }
    }
    m.userData = Object.assign({}, m.userData, { veritasRealism: true });
    m.needsUpdate = true;
    return m;
  }

  function enhanceTree(root, category) {
    if (!root || !root.traverse) return;
    root.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      if (obj.geometry && !obj.geometry.boundingSphere) obj.geometry.computeBoundingSphere();

      const name = String(obj.name || '').toLowerCase();
      const materialKind =
        /glass|window|windscreen|windshield/.test(name) ? 'glass' :
        /tyre|tire|rubber|wheel/.test(name) ? 'rubber' : 'surface';

      if (Array.isArray(obj.material)) {
        obj.material = obj.material.map((m) => improveMaterial(m, materialKind));
      } else if (obj.material) {
        obj.material = improveMaterial(obj.material, materialKind);
      }

      // Prevent z-fighting on coplanar surfaces without moving world geometry.
      if (obj.material && 'polygonOffset' in obj.material && category === 'building') {
        obj.material.polygonOffset = true;
        obj.material.polygonOffsetFactor = 1;
        obj.material.polygonOffsetUnits = 1;
      }
    });
  }

  function addVehicleMicroDetails(vehicle) {
    const root = vehicle && (vehicle.g || vehicle);
    if (!root || !root.isObject3D || root.userData.veritasDetailed) return;
    root.userData.veritasDetailed = true;

    // Refine all existing car parts first; don't replace the game's vehicle,
    // steering, wheel, door, boot, plate or animation systems.
    enhanceTree(root, 'vehicle');

    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    if (!Number.isFinite(size.x) || size.x <= 0 || size.z <= 0) return;

    // Add small, restrained reflective trim strips along each side. The
    // group's local coordinate system is used so vehicle movement stays intact.
    const detail = new THREE.Group();
    detail.name = 'veritas-vehicle-trim';
    const width = Math.max(0.012, Math.min(0.026, size.x * 0.009));
    const length = Math.max(0.35, size.z * 0.53);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x44484c, roughness: 0.42, metalness: 0.48
    });

    for (const side of [-1, 1]) {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(width, width, length),
        mat
      );
      strip.name = 'subtle-side-trim';
      strip.position.set(side * size.x * 0.49, size.y * 0.31, 0);
      strip.castShadow = true;
      strip.receiveShadow = true;
      detail.add(strip);
    }

    root.add(detail);
  }

  function improveCharacter(character) {
    if (!character || !character.traverse || character.userData?.veritasCharacterPass) return;
    character.userData = Object.assign({}, character.userData, { veritasCharacterPass: true });
    enhanceTree(character, 'character');

    // Preserve the rig and proportions. A slightly matte finish and correct
    // shadowing help avoid the toy-like, over-shiny appearance.
    character.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) {
        if (!m) continue;
        if ('roughness' in m) m.roughness = Math.max(m.roughness ?? 0.7, 0.66);
        if ('metalness' in m) m.metalness = Math.min(m.metalness ?? 0, 0.04);
      }
    });
  }

  function applyToExistingWorld() {
    try {
      if (window.outdoor && window.outdoor.traverse) {
        window.outdoor.traverse((obj) => {
          if (!obj.isMesh) return;
          const n = String(obj.name || '').toLowerCase();
          const category = /building|hostel|chapel|cafe|hall|shop|wall|floor|roof/.test(n)
            ? 'building' : 'world';
          if (obj.parent && obj.parent.userData && obj.parent.userData.isCharacter) {
            improveCharacter(obj.parent);
          } else {
            enhanceTree(obj, category);
          }
        });
      }
      if (window.scene && window.scene.traverse) {
        window.scene.traverse((obj) => {
          if (!obj.isMesh) return;
          const n = String(obj.name || '').toLowerCase();
          if (/character|student|npc|player|sim/.test(n)) improveCharacter(obj);
        });
      }
    } catch (err) {
      console.warn('[VERITAS realism] Existing-world pass skipped safely:', err);
    }
  }

  function installWrappers() {
    // Keep the original functions and all their gameplay behavior.
    if (typeof window.buildVehicle === 'function' && !window.buildVehicle.__veritasWrapped) {
      original.buildVehicle = window.buildVehicle;
      const wrapped = function (...args) {
        const vehicle = original.buildVehicle.apply(this, args);
        try { addVehicleMicroDetails(vehicle); } catch (e) {
          console.warn('[VERITAS realism] Vehicle enhancement skipped:', e);
        }
        return vehicle;
      };
      wrapped.__veritasWrapped = true;
      window.buildVehicle = wrapped;
    }

    if (typeof window.makeSim === 'function' && !window.makeSim.__veritasWrapped) {
      original.makeSim = window.makeSim;
      const wrapped = function (...args) {
        const character = original.makeSim.apply(this, args);
        try { improveCharacter(character); } catch (e) {
          console.warn('[VERITAS realism] Character enhancement skipped:', e);
        }
        return character;
      };
      wrapped.__veritasWrapped = true;
      window.makeSim = wrapped;
    }

    applyToExistingWorld();
  }

  // Wait until the rest of the game's classic scripts have declared their
  // functions and built the first scene. Repeat a few times for late NPC spawns.
  let attempts = 0;
  function boot() {
    installWrappers();
    attempts += 1;
    if (attempts < 8) window.setTimeout(boot, 700);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.setTimeout(boot, 0), { once: true });
  } else {
    window.setTimeout(boot, 0);
  }

  // Global opt-in helper for debugging from DevTools.
  window.VERITAS_REALISM = {
    reapply: applyToExistingWorld,
    enhanceCharacter: improveCharacter,
    enhanceVehicle: addVehicleMicroDetails
  };
})();
