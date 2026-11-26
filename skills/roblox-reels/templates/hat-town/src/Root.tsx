import React from "react";
import { Composition } from "remotion";
import { HatTown } from "./hat/HatTown";
import { TOTAL, FPS } from "./hat/story";
export const Root: React.FC = () => (
  <Composition id="HatTown" component={HatTown} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
);
