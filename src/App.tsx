import { TranscriptionPanel } from "./components/TranscriptionPanel";
import { ConfigurationPanel } from "./components/ConfigurationPanel";
import { FinalisationPanel } from "./components/FinalisationPanel";
import React, { useState } from "react";
import "./styles/App.sass";
import "./styles/baseStyles.sass";

interface I_ComponentsMap {
  transcript: JSX.Element;
  config: JSX.Element;
  finalise: JSX.Element;
}

type Purpouse = "transcript" | "config" | "finalise";

export default function App() {
  const componentsMap: I_ComponentsMap = {
    transcript: <TranscriptionPanel />,
    config: <ConfigurationPanel />,
    finalise: <FinalisationPanel />,
  };

  const purpouses = Object.keys(componentsMap) as Purpouse[];
  const currentPurpouse: Purpouse = purpouses[0] as Purpouse;
  const [currentComponent, setCurrentComponent] = useState(
    componentsMap[currentPurpouse]
  );
  const handleClick = (event: React.MouseEvent) => {
    const purpouse = event.currentTarget?.getAttribute(
      "data-purpouse"
    ) as Purpouse;
    if (purpouse === null) {
      return;
    }
    document
      .querySelectorAll("nav button")
      .forEach((el) => el.classList.remove("active"));
    event.currentTarget?.classList.add("active");
    setCurrentComponent(componentsMap[purpouse]);
  };
  return (
    <>
      <nav>
        <button data-purpouse="config" onClick={handleClick}>
          {" "}
          Konfiguracja{" "}
        </button>
        <button data-purpouse="transcript" onClick={handleClick}>
          {" "}
          Transkrypcja{" "}
        </button>
        <button data-purpouse="finalise" onClick={handleClick}>
          {" "}
          Finalizacja{" "}
        </button>
      </nav>
      {currentComponent}
    </>
  );
}
export const E_API_ADDRESS = "http://localhost:5002";
