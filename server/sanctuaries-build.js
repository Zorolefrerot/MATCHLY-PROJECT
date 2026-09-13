import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../art_sources/konoha/blender/", import.meta.url));

const files = Object.freeze({
  blend: Object.freeze({
    name: "konoha_14_sanctuaries_preview.blend",
    file: "konoha_14_sanctuaries_preview.blend",
    label: "Scène Blender · 14 sanctuaires",
  }),
  glb: Object.freeze({
    name: "konoha_14_sanctuaries_preview.glb",
    file: "konoha_14_sanctuaries_preview.glb",
    label: "Modèles 3D GLB · 14 sanctuaires",
  }),
  preview: Object.freeze({
    name: "konoha-14-sanctuaries-blender-preview.png",
    file: "../../../docs/images/konoha-14-sanctuaries-blender-preview.png",
    label: "Aperçu rendu Blender · PNG",
  }),
});

export function sanctuaryPath(key) {
  const asset = files[key];
  if (!asset) return null;
  return fileURLToPath(new URL(asset.file, new URL("../art_sources/konoha/blender/", import.meta.url)));
}

export function sanctuaryDownloadInfo() {
  return Object.fromEntries(
    Object.entries(files).map(([key, asset]) => {
      const path = sanctuaryPath(key);
      return [
        key,
        {
          name: asset.name,
          label: asset.label,
          bytes: statSync(path).size,
          url: `/api/konoha-sanctuaries/${key}`,
        },
      ];
    }),
  );
}
