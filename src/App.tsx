import { useEffect, useState, useRef, MouseEvent } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import "./styles/css/App.css";
import WaveSurfer from "wavesurfer.js";
import config from "./config.json";

const queryClient = new QueryClient();

const API_ADDRESS = "http://localhost:5002";

let selectedLine = 0;
let audioElements: Array<WaveSurfer> = [];

const areSetsTheSame = (
  leftSet: Set<string>,
  rightSet: Set<string>
): boolean => {
  if (leftSet.size != rightSet.size) {
    return false;
  }
  for (let val in leftSet.values()) {
    if (!rightSet.has(val)) {
      return false;
    }
  }
  return true;
};


const fetchLines = async (offset: number = 0, limit: number = 30) => {
  const apiEndpoints = ["bindings", "audios", "texts"];
  let fetchedData: any = {};
  for (const endpoint of apiEndpoints) {
    const res: Array<any> = await fetch(
      `${API_ADDRESS}/${endpoint}?offset=${offset}&limit=${limit}`
    ).then((res) => res.json());
    fetchedData[endpoint] = res;
  }
  let data = [];
  const fetchedAmount = fetchedData["bindings"].length;
  for (let index = 0; index < fetchedAmount; index++) {
    const currentBinding = fetchedData["bindings"][index],
      currentAudio = fetchedData["audios"][index],
      currentText = fetchedData["texts"][index];
      

    const currentData = {
      id: currentBinding["id"] as number,
      category_id: currentBinding["category_id"] as number,
      audio_name: currentAudio["name"] as string,
      audio_dir: currentAudio['directory'] as string,
      transcript: currentText["transcript"] as string,
    };
    data.push(currentData);
  }
  data.sort((prev, cur) => {
    const sortingKey = "audio_name";
    const audioNameLength = prev[sortingKey].length;
    for (let i = 0; i < audioNameLength; i++) {
      if (prev[sortingKey][i] > cur[sortingKey][i]) return 1;
      if (prev[sortingKey][i] < cur[sortingKey][i]) return -1;
    }
    return 0;
  });
  return data;
};

export default function App() {
  const minElementsPerPage = 10;
  const initialElementsPerPage: number = config["elementsPerPage"];
  const maxElementsPerPage = 50;
  const [lines, setLines] = useState(Array());
  const [page, setPage] = useState(0);
  const [elementsPerPage, setElementsPerPage] = useState(
    initialElementsPerPage
  );
  const totalData = useRef(0);

  useEffect(() => {
    fetchLines(elementsPerPage * page, elementsPerPage).then(async (el) =>
      setLines(el)
    );
    (async () => {
      const res = await fetch(`${API_ADDRESS}/get_size`).then(
        async (el) => await el.json()
      );
      totalData.current = res["count_1"];
    })();
  }, [page, elementsPerPage]);

  if (totalData.current === 0) {
    return <p> Loading </p>;
  }
  const amountOfPages = Math.ceil(totalData.current / elementsPerPage);
  const paginationLines = [];

  const handlePaginationClick = (ev: any) => {
    const newPage: number = ev.target.getAttribute("data-page");
    const allPaginationsButtons = document.querySelectorAll(".paginationElement");
    allPaginationsButtons.forEach(el => el.classList.remove('active'));
    if (newPage === page) return;
    setPage(newPage);
    allPaginationsButtons[newPage].classList.add('active');
  };

  for (let i = 0; i < amountOfPages; i++) {
    const classes = `paginationElement ${i === page ? "active" : ""}`;
    const paginationElement = (
      <span className={classes} onClick={handlePaginationClick} data-page={i}>
        <span data-page={i}>{i + 1}</span>
      </span>
    );
    paginationLines.push(paginationElement);
  }
  const handleLineClick = (event: MouseEvent<HTMLDivElement>) => {
    const currentIndex = event.currentTarget;
    selectedLine = Number(currentIndex.getAttribute("data-line-order"));
  };
  document.onkeyup = (event: KeyboardEvent) => {
    event.preventDefault()
    if (event.key === "F2") {
      const currentAudio = audioElements[selectedLine];
      if (currentAudio.isPlaying()) {
        currentAudio.pause();
        return;
      }
      currentAudio.play();
    }
    if (event.key === "F8") {
      const currentAudio = audioElements[selectedLine];
      if (currentAudio.isPlaying()) {
        currentAudio.setCurrentTime(0);
        currentAudio.stop();
        return;
      }
      currentAudio.play();      
    }
  };
  const transcriptLines = lines.map((line, index) => (
    <div
      data-id={line["id"]}
      data-line-order={index}
      className="line"
      onClick={handleLineClick}
    >
      <span key={`name_${line["audio_name"]}`}>{line["audio_name"]}</span>
      <WaveAudio
        index={index}
        audio_dir = {line["audio_dir"]}
        audio_name={`${line["audio_name"]}`}
        key={`audio_${line["id"]}`}
      />
      <Transcript
        key={`transcript_${line["audio_name"]}_${line["id"]}`}
        transcript={line["transcript"]}
        id={line["id"]}
        index={index}
      />
      <Category
        key={`category_${line["audio_name"]}_${line["id"]}`}
        currentCategory={line["category_id"]}
        id={line["id"]}
      />
    </div>
  ));

  const handleInput = (ev: any) => {
    const newVal = ev.target.value;
    if (Number(newVal) < minElementsPerPage)
      setElementsPerPage(minElementsPerPage);
    setElementsPerPage(newVal);
  };
  document.title = `Katerskrypcja: Strona ${Number(page) + Number(1)}`;
  return (
    <QueryClientProvider key="query_provider" client={queryClient}>
      <div id="transcript" key="transcript">
        <div id="lines">
          <div className="heading">
            <span className="heading_name"> Nazwa </span>
            <span className="heading_name"> Plik audio </span>
            <span className="heading_name"> Transkrypt </span>
            <span className="heading_name"> Kategoria </span>
          </div>
          {transcriptLines}
        </div>
        <div id="pagination">{paginationLines}</div>
      </div>
      <div id="sidebar">
        <p className="heading_name"> Prosty panel konfiguracji </p>
        <CategoryAddForm key="new_category_submit" />
        <Finalise key="categorise" />
      </div>
    </QueryClientProvider>
  );
}

function Transcript(props: any) {
  const [text, setText] = useState(props["transcript"]);

  const handleChange = async (ev: any) => {
    setText(ev.target.value);
  };
  const handleBlur = async (ev: any) => {
    setText(ev.target.value);
    const bindingId = ev.currentTarget.parentElement.getAttribute("data-id");
    const res = await fetch(`${API_ADDRESS}/texts`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        bindings_id: bindingId,
      }),
    })
      .then((res) => res.json())
      .catch((err) => err);
    console.log("Transkrypt: ", res);
  };
  const handleFocus = (ev: any) => {
    const lineOrder =
      ev.currentTarget.parentElement.getAttribute("data-line-order");
    selectedLine = Number(lineOrder);
  };
  return (
    <textarea
      title="Transkrpcja"
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      tabIndex={props["index"] + 1}
      className="transcript"
    ></textarea>
  );
}

function Category(props: any) {
  const [category, setCategory] = useState(0);
  const { isLoading, error, data, refetch } = useQuery("repoData", async () => {
    const res = await fetch(`${API_ADDRESS}/categories`);
    return await res.json();
  });
  useEffect(() => {
    setCategory(props["currentCategory"]);
  }, [props]);

  if (isLoading)
    return (
      <select disabled={true}>
        <option> Ładowanie...</option>
      </select>
    );
  if (error)
    return (
      <select disabled={true}>
        <option> Błąd: {error}</option>
      </select>
    );

  const handleChange = async (ev: any) => {
    setCategory(ev.target.value);
    const bindingId = ev.currentTarget.parentElement.getAttribute("data-id");
    const res = await fetch(`${API_ADDRESS}/categories`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        category_id: Number(ev.target.value),
        bindings_id: bindingId,
      }),
    })
      .then((res) => res.json())
      .catch((err) => console.error(err));
    console.log("Dane: ", res);
  };
  const handleClick = () => refetch();
  const categories = data.map((category: any, index: number) => {
    return (
      <option key={`option_${category["id"]}_${index}`} value={category["id"]}>
        {category["name"].trim()}
      </option>
    );
  });
  return (
    <select
      title="Kategorie głosów"
      onChange={handleChange}
      onClick={handleClick}
      value={category}
      className="category"
    >
      {categories}
    </select>
  );
}

function CategoryAddForm() {
  const [categoryName, setCategoryName] = useState("");
  const handleChange = (ev: any) => {
    setCategoryName(ev.target.value);
  };
  const handleSubmit = async (ev: any) => {
    ev.preventDefault();
    const dataFromForm = new FormData(ev.target);
    const res = await fetch(`${API_ADDRESS}/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Object.fromEntries(dataFromForm.entries())),
    })
      .then((res) => res.json())
      .catch((err) => err);
    console.log("Nowa kategoria: ", res);
    setCategoryName("");
  };
  return (
    <form id="new_category_form" onSubmit={handleSubmit} method="post">
      <h4> Dodawanie nowej kategorii </h4>
      <input
        type="text"
        value={categoryName}
        onChange={handleChange}
        name="category_name"
        autoComplete="off"
        required
      />
      <br />
      <input type="submit" name="add_category" value="Prześlij" />
    </form>
  );
}

function Finalise() {
  const [categoriseLevel, setCategoriseLevel] = useState(0);

  const [format, setFormat] = useState(false);
  const [isWorking, setIsWorking] = useState(false)
  const modes = ["tacotron", "multispeaker"]
  const handleSubmit = async (event: any) => {
    event.preventDefault();
    setIsWorking(true)
    const data = new FormData(event.currentTarget);
    data.set("should_format", format as unknown as string )
    data.set("mode", modes[categoriseLevel])
    data.set("maximum_length", String(config['maximumLength']) )
    data.set("minimum_length", String(config['minimumLength']) )
    console.log([...data]);
    const finalise = await fetch(`${API_ADDRESS}/finalise`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Object.fromEntries(data.entries())),
    }).then((el) => el.json()).catch((err) => { console.error(err) });
    setIsWorking(false);
  };
  const handleLevelChange = (event: any) => {
    setCategoriseLevel(event.currentTarget.value);
  };

  const handleFormatChange = (event: any) => {
    setFormat(event.currentTarget.checked);
  }
  const levelTitles = [
    "Kategoryzacja + Podział na listy",
    "Eksport do multispeaker",
  ];

  const formatMessages = [
    "Pliki nie będą formatowane",
    "Pliki zostaną dodatkowo sformatowane"
  ]
  return (
    <form method="POST" id="categorise" onSubmit={handleSubmit}>
      <h4> Finalizacja </h4>
      <p> {levelTitles[categoriseLevel]} </p>
      <input
        type="range"
        min={0}
        max={1}
        step={1}
        value={categoriseLevel}
        onChange={handleLevelChange}
        name="categoriseLevel"
        title={levelTitles[categoriseLevel]}
      />
      <br />
      <label htmlFor="shouldFormat"> Formatować pliki? </label> 
{       <input
        type="checkbox"
        id="shouldFormat"
        name="shouldFormat"
        onChange={handleFormatChange}
        value={Number(format)}
        title="Jeżeli zaznaczone, to pliki zostaną sformatowane na odpowiedni format. Jeżeli nie, będą skopiowane oryginały."
      />
  }
      <br />

      <input type="submit" name="categorise" value="Finalizuj" disabled={isWorking} />
    </form>
  );
}

function WaveAudio(props: { index: number; audio_name: string; audio_dir: string }) {
  const waveAudioRef = useRef({} as WaveSurfer);
  const audioContainerRef = useRef({} as HTMLElement);
  const handleClick = (ev: any) => {
    if (!waveAudioRef.current.isPlaying()) {
      waveAudioRef.current.play();
      return;
    }
    waveAudioRef.current.pause();
  };
  useEffect(() => {
    const audioElement = document.querySelector(
      `#waveform_${props["index"]}`
    ) as HTMLElement;
    audioContainerRef.current = audioElement;
    const waveform = WaveSurfer.create({
      container: audioElement,
      waveColor: "#0569ff",
      progressColor: "#0353cc",
    });
    waveform.on("error", (err) => {
      console.log("Błąd", err)
    })
    const pathToFile = `${props['audio_dir']}/${props["audio_name"]}`
    console.log(pathToFile);
    waveform.load(pathToFile);
    audioElements.push(waveform);
    waveAudioRef.current = waveform;
    return () => {
      waveform.destroy();
      audioElements.splice(0, audioElements.length);
    };
  });

  return <div id={`waveform_${props["index"]}`} onClick={handleClick}></div>;
}
