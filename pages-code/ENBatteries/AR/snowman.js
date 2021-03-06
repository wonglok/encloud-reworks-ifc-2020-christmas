import { AnimationMixer, Color } from "three";
import { GLTFLoader, SkeletonUtils } from "three-stdlib";
import { FolderName } from ".";
import { enableBloom } from "../../Bloom/Bloom";

export const title = `${FolderName}.snowman`;

let ProviderCache = new Map();
let provideURL = (Loader, url) =>
  new Promise((resolve) => {
    if (ProviderCache.has(url)) {
      resolve(ProviderCache.get(url));
      return;
    }
    new Loader().load(url, (v) => {
      ProviderCache.set(url, v);
      resolve(v);
    });
  });

let easyEvent = (node, event, fnc) => {
  window.addEventListener(event, fnc);
  node.onClean(() => {
    window.removeEventListener(event, fnc);
  });
};

let sleep = (t) => {
  return new Promise((resolve) => {
    setTimeout(resolve, t);
  });
};

// preload
provideURL(
  GLTFLoader,
  "https://res.cloudinary.com/loklok-keystone/image/upload/v1621907814/copyrighted-air-concepts/ifc2020-christmas/IFC_XMas_snowman_1112.glb"
);

export const effect = async (node) => {
  let scene = await node.ready.scene;
  let camera = await node.ready.camera;
  let renderer = await node.ready.gl;
  let raycaster = await node.ready.raycaster;
  let mouse = await node.ready.mouse;

  easyEvent(
    node,
    "add-object-many-times",
    async ({ detail: { type, birthPlace, cameraPosition } }) => {
      if (type !== "snowman") {
        return;
      }
      let tree = await provideURL(
        GLTFLoader,
        "https://res.cloudinary.com/loklok-keystone/image/upload/v1621907814/copyrighted-air-concepts/ifc2020-christmas/IFC_XMas_snowman_1112.glb"
      );

      let cloned = SkeletonUtils.clone(tree.scene);
      cloned.position.copy(birthPlace);
      cameraPosition.y = 0;
      cloned.lookAt(cameraPosition);

      cloned.traverse((item) => {
        if (
          item.material &&
          item.material.name.toLowerCase().indexOf("light") !== -1
        ) {
          enableBloom(item);
        }
        if (
          item.material &&
          item.material.name.toLowerCase().indexOf("star") !== -1
        ) {
          enableBloom(item);
        }

        if (item.material) {
          item.castShadow = true;
        }
        if (item.material) {
          item.material.roughness = 0.8;
          item.material.metalness = 0.01;
        }
      });

      scene.add(cloned);

      node.onClean(() => {
        scene.remove(cloned);
      });

      let mixer = new AnimationMixer(cloned);

      node.onLoop((tt, dt) => {
        mixer.update(dt);
      });
      node.onClean(() => {
        mixer.stopAllAction();
      });

      // Start
      // Event
      // loopend
      // idle

      let actions = [
        mixer.clipAction(
          tree.animations.find((e) => e.name.toLowerCase() === "start"),
          cloned
        ),
        mixer.clipAction(
          tree.animations.find((e) => e.name.toLowerCase() === "event"),
          cloned
        ),
        mixer.clipAction(
          tree.animations.find((e) => e.name.toLowerCase() === "loopend"),
          cloned
        ),
      ];

      let canAgain = true;
      let doAll = async () => {
        for (let action of actions) {
          action.clampWhenFinished = true;
          action.repetitions = 1;
          action.play();
          await sleep(action.getClip().duration * 1000 - 16.667);
        }
        if (canAgain) {
          await doAll();
        }
      };
      node.onClean(() => {
        canAgain = false;
      });
      doAll();
    }
  );
};
