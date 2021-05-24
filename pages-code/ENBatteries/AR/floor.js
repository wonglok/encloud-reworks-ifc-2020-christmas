import {
  BoxBufferGeometry,
  Camera,
  CircleBufferGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneBufferGeometry,
  Raycaster,
  RingBufferGeometry,
  ShaderMaterial,
  SphereBufferGeometry,
  Vector2,
  Vector3,
} from "three";
import { OrbitControls } from "three-stdlib";
import { FolderName } from ".";
import { enableBloom } from "../../Bloom/Bloom";

export const title = `${FolderName}.floor`;

export const effect = (node) => {
  //
  let camera = node.userData.camera;
  camera.position.y = 5;
  camera.position.z = -5;
  camera.lookAt(0, 0, 0);
  setTimeout(() => {
    camera.position.z = 0;
  });

  new Floor({ node });

  window.addEventListener(
    "add-object-many-times",
    ({ detail: { birthPlace, cameraPosition } }) => {
      new Item({ birthPlace, node, cameraPosition });
    }
  );
};

export class Item {
  constructor({ node, birthPlace, cameraPosition }) {
    this.node = node;
    this.birthPlace = birthPlace;
    this.cameraPosition = cameraPosition;
    this.setup();
  }
  async setup() {
    let item = new Mesh(
      new SphereBufferGeometry(0.5, 32, 32),
      new MeshStandardMaterial({
        metalness: 1.0,
        roughness: 0.1,
      })
    );
    item.position.y += 0.5;

    enableBloom(item);

    //
    console.log(this.birthPlace, this.cameraPosition);
    item.position.copy(this.birthPlace);
    item.lookAt(this.cameraPosition);
    this.node.userData.scene.add(item);
    this.node.onClean(() => {
      this.node.userData.scene.remove(item);
    });
    //
  }
}

export class Floor {
  constructor({ node }) {
    this.node = node;
    this.setup();
  }
  async setup() {
    let renderer = this.node.userData.gl;
    let scene = this.node.userData.scene;
    let camera = this.node.userData.camera;

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
    };
    makeDoughnut();
    let mouse = new Vector2(0, 0);
    let raycaster = new Raycaster();
    let currentBornLocation = new Vector3(0, 0, 0);
    const scanCenter = () => {
      mouse.x = 0.5 * 2 - 1;
      mouse.y = -(0.5 + 0.0) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      var intersects = raycaster.intersectObjects(raycasterList);
      for (var i = 0; i < intersects.length; i++) {
        let pt = intersects[i].point;
        currentBornLocation.copy(pt);
        window.dispatchEvent(new CustomEvent("center-cursor", { detail: pt }));
      }
    };

    //

    let parent = renderer.domElement.parentNode;
    let domElement = document.createElement("div");

    domElement.innerHTML = "Place Item";
    domElement.style.cssText = `
      position: absolute;
      bottom: 30px;
      left: calc(50% - 100px);
      padding: 10px 0px;
      width: 200px;
      background-color: rgb(212 37 37);
      border-radius: 20px;
      text-align: center;
      color: rgb(255 224 177);
      font-size: 25px;
      cursor: pointer;
    `;

    //

    parent.appendChild(domElement);
    console.log(domElement);
    this.node.onClean(() => {
      domElement.remove();
      //
    });
    window.addEventListener("on-stop-add", () => {
      domElement.remove();
    });
    //
    let onClickAdd = () => {
      window.dispatchEvent(
        new CustomEvent("add-object-many-times", {
          detail: {
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
    domElement.addEventListener("click", onClickAdd);
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

    let fakeCam = new Camera();
    fakeCam.position.copy(camera.position);
    fakeCam.rotation.copy(camera.rotation);
    // fakeCam.lookAt(0, 0, 0);
    let controls = new OrbitControls(fakeCam, renderer.domElement);
    // controls.target.y += camera.position.y;
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableRotate = true;
    controls.enableZoom = false;

    let camdir = new Vector3();
    camera.getWorldDirection(camdir);

    this.node.onLoop(() => {
      controls.update();
      camera.rotation.copy(fakeCam.rotation);
      // fakeCam.position.copy(camera.position);
      // if (controls && controls.target) {
      //   controls.target.set(
      //     camera.position.x + camdir.x,
      //     camera.position.y + camdir.y,
      //     camera.position.z + camdir.z
      //   );
      // }
    });
  }
}