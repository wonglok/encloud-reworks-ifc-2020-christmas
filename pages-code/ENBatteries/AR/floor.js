import {
  // BoxBufferGeometry,
  Camera,
  CircleBufferGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  // MeshStandardMaterial,
  Object3D,
  PlaneBufferGeometry,
  Raycaster,
  RingBufferGeometry,
  ShaderMaterial,
  // SphereBufferGeometry,
  Vector2,
  Vector3,
} from "three";
import { OrbitControls } from "three-stdlib";
import { FolderName } from ".";
// import { enableBloom } from "../../Bloom/Bloom";
import { canUseDeviceOrientationControls } from "../../ENCloudSDK/ENUtils";

export const title = `${FolderName}.floor`;

export const effect = async (node) => {
  let camera = await node.ready.camera;
  let scene = await node.ready.scene;
  let renderer = await node.ready.gl;
  let raycaster = await node.ready.raycaster;
  let mouse = await node.ready.mouse;

  //
  camera.position.z = -7.5;
  camera.position.y = 5.5;
  camera.lookAt(0, 0, 0);

  new Floor({ node });

  // window.addEventListener(
  //   "add-object-many-times",
  //   ({ detail: { birthPlace, cameraPosition } }) => {
  //     new Item({ node, birthPlace, cameraPosition });
  //   }
  // );
};

// export class Item {
//   constructor({ node, birthPlace, cameraPosition }) {
//     this.node = node;
//     this.birthPlace = birthPlace;
//     this.cameraPosition = cameraPosition;
//     this.setup();
//   }
//   async setup() {
//     let scene = await this.node.ready.scene;
//     let camera = await this.node.ready.camera;
//     let renderer = await this.node.ready.gl;
//     let raycaster = await this.node.ready.raycaster;
//     let mouse = await this.node.ready.mouse;

//     let item = new Mesh(
//       new SphereBufferGeometry(0.5, 32, 32),
//       new MeshStandardMaterial({
//         metalness: 1.0,
//         roughness: 0.1,
//       })
//     );
//     item.position.y += 0.5;

//     enableBloom(item);

//     item.position.copy(this.birthPlace);
//     item.lookAt(this.cameraPosition);

//     scene.add(item);
//     this.node.onClean(() => {
//       scene.remove(item);
//     });
//     //
//   }
// }

export class Floor {
  constructor({ node }) {
    this.node = node;
    this.setup();
  }
  async setup() {
    let scene = await this.node.ready.scene;
    let camera = await this.node.ready.camera;
    let renderer = await this.node.ready.gl;
    let raycaster = await this.node.ready.raycaster;
    let mouse = await this.node.ready.mouse;

    // let renderer = this.node.userData.gl;
    // let scene = this.node.userData.scene;
    // let camera = this.node.userData.camera;

    //
    let o3 = new Object3D();
    scene.add(o3);
    this.node.onClean(() => {
      scene.remove(o3);
    });

    let raycasterList = [];
    let geo = new PlaneBufferGeometry(20000, 20000, 2, 2);
    geo.rotateX(Math.PI * -0.5);

    let mesh = new Mesh(
      geo,
      new ShaderMaterial({
        fragmentShader: `
          void main (void) {
            discard;
          }
        `,
      })
    );
    o3.add(mesh);

    raycasterList.push(mesh);

    let makeDoughnut = () => {
      let cubeGeo = new RingBufferGeometry(8.8, 9.5, 36.0, 6.0);
      cubeGeo.scale(0.05, 0.05, 0.05);
      cubeGeo.rotateX(Math.PI * -0.5);
      let target = new Vector3();

      let yellow = new Color("#FFE7C7");
      let red = new Color("#ff0000");
      let cubeMat = new MeshBasicMaterial({
        color: new Color("#FFE7C7"),
        transparent: true,
        opacity: 0.4,
      });

      let circleGeo = new CircleBufferGeometry(8.8 - 1.6, 36);
      circleGeo.scale(0.05, 0.05, 0.05);
      circleGeo.rotateX(Math.PI * -0.5);
      circleGeo.translate(0, 0.03, 0.0);
      let circle = new Mesh(circleGeo, cubeMat);
      //
      o3.add(circle);

      let cube = new Mesh(cubeGeo, cubeMat);
      o3.add(cube);
      cube.position.set(0, 0.1, -2.5 + 1.0);

      //
      this.node.onLoop(() => {
        let time = window.performance.now() * 0.001;

        if (target.length() > 25) {
          //
          window.dispatchEvent(
            new CustomEvent("distance", { detail: { mode: "far-away" } })
          );
          cubeMat.color = red;
        } else {
          //
          window.dispatchEvent(
            new CustomEvent("distance", { detail: { mode: "ok" } })
          );
          cubeMat.color = yellow;
        }

        circle.position.lerp(target, 0.3);
        circle.position.y = (Math.sin(time * 1.8) + 1) * 0.5 * 0.3;

        cube.position.lerp(target, 0.3);
        cube.position.y = (Math.sin(time * 1.8) + 1) * 0.5 * 0.3;
      });

      window.addEventListener("center-cursor", ({ detail }) => {
        // cube.position.x = detail.x
        // cube.position.z = detail.z
        target.x = detail.x;
        target.y = detail.y;
        target.z = detail.z;
      });

      window.addEventListener("on-stop-add", () => {
        cube.visible = false;
        circle.visible = false;

        cube.scale.set(0.0, 0.0, 0.0);
        circle.scale.set(0.0, 0.0, 0.0);
        cubeMat.opacity = 0.0;
      });

      this.node.onClean(() => {
        cube.visible = false;
        circle.visible = false;

        cube.scale.set(0.0, 0.0, 0.0);
        circle.scale.set(0.0, 0.0, 0.0);
        cubeMat.opacity = 0.0;
      });
    };
    makeDoughnut();
    let mouseCenter = new Vector2(0, 0);
    let raycasterSim = new Raycaster();
    let currentBornLocation = new Vector3(0, 0, 0);
    const scanCenter = () => {
      mouseCenter.x = 0.5 * 2 - 1;
      mouseCenter.y = -(0.5 + 0.0) * 2 + 1;

      raycasterSim.setFromCamera(mouseCenter, camera);
      var intersects = raycasterSim.intersectObjects(raycasterList);
      for (var i = 0; i < intersects.length; i++) {
        let pt = intersects[i].point;
        currentBornLocation.copy(pt);
        window.dispatchEvent(new CustomEvent("center-cursor", { detail: pt }));
      }
    };

    //

    let currentType = "tree";

    let parent = renderer.domElement.parentNode;
    let makeButton = () => {
      let button = document.createElement("div");

      button.innerHTML = "Place Item";
      button.style.cssText = `
        color: rgb(255 231 194);
        background-color: rgb(33 162 191);

        position: absolute;
        bottom: 30px;
        left: calc(50% - 100px);
        padding: 10px 0px;
        width: 200px;
        border-radius: 20px;
        text-align: center;
        font-size: 25px;
        cursor: pointer;
      `;

      parent.appendChild(button);
      console.log(button);
      this.node.onClean(() => {
        button.remove();
        //
      });

      window.addEventListener("on-stop-add", () => {
        button.remove();
      });

      //
      let onClickAdd = () => {
        window.dispatchEvent(
          new CustomEvent("add-object-many-times", {
            detail: {
              type: currentType,
              birthPlace: currentBornLocation.clone(),
              cameraPosition: camera.position.clone(),
            },
          })
        );

        // //
        // //
        // domElement.remove();
        // domElement.removeEventListener("click", onClickAdd);
        // // domElement.removeEventListener("touchstart", onClickAdd);
        // window.dispatchEvent(
        //   new CustomEvent("on-stop-add", {
        //     detail: {
        //       birthPlace: currentBornLocation.clone(),
        //       cameraPosition: camera.position.clone(),
        //     },
        //   })
        // );
      };
      button.addEventListener("click", onClickAdd);
      //
    };

    makeButton();

    let makeButtonChoose = ({ text, type, offset = 0 }) => {
      let button = document.createElement("div");

      button.innerHTML = text;
      button.style.cssText = `
        color: rgb(255, 231, 194);
        background-color: rgba(33, 162, 191, 0.5);

        position: absolute;
        bottom: 130px;
        left: calc(50% - 100px / 2 + ${offset}px);
        padding: 10px 0px;
        width: 100px;
        border-radius: 20px;
        text-align: center;
        font-size: 15px;
        cursor: pointer;
      `;
      window.addEventListener("reload-css", () => {
        button.style.cssText = `
          color: rgb(255, 231, 194);
          background-color: rgba(33, 162, 191, ${
            currentType === type ? 1 : 0.5
          });

          position: absolute;
          bottom: 130px;
          left: calc(50% - 100px / 2 + ${offset}px);
          padding: 10px 0px;
          width: 100px;
          border-radius: 20px;
          text-align: center;
          font-size: 15px;
          cursor: pointer;
        `;
      });

      parent.appendChild(button);
      console.log(button);
      this.node.onClean(() => {
        button.remove();
        //
      });

      window.addEventListener("on-stop-add", () => {
        button.remove();
      });

      //
      let onClickAdd = () => {
        currentType = type;

        window.dispatchEvent(new CustomEvent("reload-css"));
      };
      window.dispatchEvent(new CustomEvent("reload-css"));
      button.addEventListener("click", onClickAdd);
      //
    };
    makeButtonChoose({ offset: 130, text: "tree", type: "tree" });
    makeButtonChoose({ offset: 0, text: "house", type: "house" });
    makeButtonChoose({ offset: -130, text: "snowman", type: "snowman" });

    // domElement.addEventListener("touchstart", addItemOnce);

    let stopScanning = false;
    this.node.onLoop(() => {
      if (stopScanning) {
        return;
      }
      scanCenter();
    });
    window.addEventListener("on-stop-add", () => {
      stopScanning = true;
    });

    if (canUseDeviceOrientationControls) {
      window.addEventListener(
        "camera-rotation",
        ({ detail: { rotation, quaternion } }) => {
          if (quaternion) {
            camera.quaternion.slerp(quaternion, 0.2);
          }
        }
      );
    } else {
      let fakeCam = new Camera();
      fakeCam.position.copy(camera.position);
      fakeCam.rotation.copy(camera.rotation);

      let controls = new OrbitControls(fakeCam, renderer.domElement);
      controls.update();

      controls.enableDamping = true;
      controls.enablePan = false;
      controls.enableRotate = true;
      controls.enableZoom = false;

      this.node.onLoop(() => {
        controls.update();
        camera.rotation.copy(fakeCam.rotation);
      });
    }
  }
}
