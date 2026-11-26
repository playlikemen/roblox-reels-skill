// "The Hat Town": 42 s vertical short. One three.js world posed per frame by the Director (story.ts).
import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { World, SKY_HOR } from "./world";
import { Director, FLASH_AT } from "./story";

const Inner: React.FC = () => {
  const f = useCurrentFrame();
  const { camera, scene, gl } = useThree();
  const dir = useMemo(() => {
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    scene.fog = new THREE.Fog(SKY_HOR, 70, 320);
    return new Director(new World());
  }, [gl, scene]);
  dir.update(f, camera as THREE.PerspectiveCamera);
  return <primitive object={dir.w.root} dispose={null} />;
};

export const HatTown: React.FC = () => {
  const f = useCurrentFrame();
  const flash = f >= FLASH_AT && f < FLASH_AT + 4 ? [0.9, 0.65, 0.4, 0.15][f - FLASH_AT] : 0;
  return (
    <AbsoluteFill style={{ background: SKY_HOR }}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: true, preserveDrawingBuffer: true }} camera={{ fov: 50, near: 0.2, far: 1500 }}>
        <Inner />
      </ThreeCanvas>
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
    </AbsoluteFill>
  );
};
