import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import Head from "next/head";
import { useEffect } from "react";
import Bloom from "../pages-code/Bloom/Bloom";
import { ENRuntime, BASEURL_REST } from "../pages-code/ENCloudSDK/ENRuntime";
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

  return <group></group>;
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

export default function Home({ buildTimeCache }) {
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
          intensity={0.1}
        ></directionalLight>

        {/*  */}
        <ambientLight intensity={0.1}></ambientLight>

        {/*  */}
        <EnvMap></EnvMap>

        {/*  */}
        {/* <Bloom></Bloom> */}

        <gridHelper args={[100, 100]}></gridHelper>

        {/* <Sphere position-x={-1} args={[1, 25, 25]}>
          <meshStandardMaterial
            metalness={0.9}
            roughness={0.1}
          ></meshStandardMaterial>
        </Sphere>

        <Box position-x={1} args={[2, 2, 2, 25, 25, 25]}>
          <meshStandardMaterial
            metalness={0.9}
            roughness={0.1}
          ></meshStandardMaterial>
        </Box> */}

        {/* <OrbitControls></OrbitControls> */}
      </Canvas>
    </div>
  );
}
