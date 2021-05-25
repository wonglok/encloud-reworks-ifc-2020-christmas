import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import Head from "next/head";
import { useEffect, useRef } from "react";
import Bloom from "../pages-code/Bloom/Bloom";
import { ENRuntime, BASEURL_REST } from "../pages-code/ENCloudSDK/ENRuntime";
import {
  authoriseOrientationCam,
  canUseDeviceOrientationControls,
  makeShallowStore,
} from "../pages-code/ENCloudSDK/ENUtils";
import { EnvMap } from "../pages-code/EnvMap/EnvMap";

let getProjectJSON = () => {
  return {
    published: true,
    displayName: "encloud-reworks-ifc-2020-christmas",
    _id: "60ab69b162d0c30009e4660d",
    username: "wonglok831",
    userID: "609b49ad59f39c00098c34ea",
    slug: "encloud-reworks-ifc-2020-christmas",
    created_at: "2021-05-24T08:54:09.751Z",
    updated_at: "2021-05-24T08:54:13.863Z",
    __v: 0,
    largeString:
      '{"_id":"60ab69b162d0c30009e4660d","blockers":[],"ports":[],"connections":[],"pickers":[]}',
  };
};

let loadBattriesInFolder = () => {
  let enBatteries = [];
  let reqq = require.context("../pages-code/ENBatteries/", true, /\.js$/);
  let keys = reqq.keys();
  keys.forEach((key) => {
    enBatteries.push(reqq(key));
  });
  return enBatteries;
};

function EffectNode({ projectJSON }) {
  let three = useThree();

  useEffect(() => {
    let enRunTime = new ENRuntime({
      projectJSON: projectJSON,
      enBatteries: loadBattriesInFolder(),
      userData: {
        ...three,
      },
    });

    Object.entries(three).forEach(([key, val]) => {
      enRunTime.mini.set(key, val);
    });

    return () => {
      enRunTime.mini.clean();
    };
  }, []);

  return null;
}

export async function getStaticProps(context) {
  let project = getProjectJSON();
  let projectID = project._id;
  let buildTimeCache = await fetch(
    `${BASEURL_REST}/project?action=get-one-of-published`,
    {
      headers: {
        "content-type": "application/json;charset=UTF-8",
      },
      body: JSON.stringify({ _id: projectID }),
      method: "POST",
      mode: "cors",
    }
  )
    //
    .then((res) => {
      return res.json();
    });

  return {
    props: {
      buildTimeCache,
    }, // will be passed to the page component as props
  };
}

// https://hello-air.com/portfolio/ifc-mall-xmas-2020-glow-it-up/

function WelcomeScreen() {
  let startGame = () => {
    if (canUseDeviceOrientationControls) {
      authoriseOrientationCam();
    }
    HomeState.overlay = "none";
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-white bg-opacity-90">
      <div className="p-4 tracking-wide">
        <div className="text-2xl text-bold mb-4">
          Research based Rework of 2020 IFC Christmas Campaign
        </div>

        <div className="mb-5">
          <div className="text-xl text-gray-600 mb-2">Campaign Credits:</div>
          <div className="px-3 text-sm  tracking-tight ">
            <div className="mb-1">
              Creatives & Design: AIR Concepts, Chika Tsang, Fung Leung, Anna
              Lee, Hyper, Penny Lau
            </div>
            <div className="mb-1">
              Web AR Game Development: AIR Concepts, Gary Ng, Tony Chau, Lok
              Lok, Kezman Hung
            </div>
            <div className="mb-1">
              Instagram Filter Development: Kenny Or, Stone Shek
            </div>
            <div className="mb-1">3D Rendering: ManyMany</div>
            <div className="mb-1">Producer: Chloe Ho</div>
            <div className="mb-1">Back stage: Ken Hui, Denny Wong, Mike Wu</div>
          </div>
        </div>

        {/* reworks credit */}
        <div className="mb-5">
          <div className="text-xl text-gray-600 mb-2">Reworks Credit:</div>
          <div className="px-3 text-sm  tracking-tight ">
            <div className="mb-1">Logic Redesign: Lok Lok</div>
          </div>
        </div>

        {/* reworks login */}
        <div className="mb-5">
          <div className="text-xl text-gray-600 mb-2">Lets Go!</div>
          <div className="px-3 text-sm  tracking-tight ">
            <div
              className="mb-1 text-2xl underline cursor-pointer"
              onClick={() => {
                startGame();
              }}
            >
              Start Game
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

let HomeState = makeShallowStore({
  overlay: "welcome",
});

export default function Home({ buildTimeCache }) {
  HomeState.makeKeyReactive("overlay");
  return (
    <div className={"h-full w-full"}>
      <Head>
        <title>Reworks of IFC 2020 Christmas</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Canvas dpr={typeof window !== "undefined" && window.devicePixelRatio}>
        {/*  */}
        <EffectNode
          projectJSON={buildTimeCache || getProjectJSON()}
        ></EffectNode>

        {/*  */}
        <directionalLight
          position={[10, 10, 10]}
          intensity={0.2}
        ></directionalLight>

        {/*  */}
        <ambientLight intensity={0.2}></ambientLight>

        {/*  */}
        <EnvMap></EnvMap>

        <gridHelper args={[100, 100]}></gridHelper>

        <Bloom></Bloom>
      </Canvas>

      {HomeState.overlay === "welcome" && <WelcomeScreen></WelcomeScreen>}
    </div>
  );
}
