import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import './style.css'
import useConfig from '../../hooks/useConfig'
import type { configAPIData } from '../../../type'
// @ts-ignore
import keyboardjs from 'keyboardjs';

import type { IPanelProps } from "./types/IPanelProps";
import type { ITranscriptProps } from "./types/ITranscriptProps";
import type { ICategoryProps } from "./types/ICategoryProps";
import type { IPaginationProps } from "./types/IPaginationProps";
import type { IWaveAudioProps } from "./types/IWaveAudioProps";

const API_ADDRESS = 'http://localhost:5002';

const PanelQueryClient = new QueryClient();
const CategoryQueryClient = new QueryClient();

// Basically, offset for loading data from database
const baseObject: [number, React.Dispatch<React.SetStateAction<number>>] = [0, () => { }]
const PageOffsetContext = createContext(baseObject);
const usePageOffsetContext = () => useContext(PageOffsetContext);


const Wrapper = () => {
    const config = useConfig();
    if (config.isLoading) {
        return <p> Lolding config.</p>
    }
    const configData = config.data as configAPIData.RootObject;
    const workspaceConfig = configData['workspaceConfig'];
    return (
        <PageOffsetContext.Consumer>
            {value => {
                console.log("Value:", value);
                return <>
                    <Panel elementsPerPage={workspaceConfig['elementsPerPage']} offset={0} config={configData} />
                    <Pagination key='pagination' elementsPerPage={workspaceConfig['elementsPerPage']} />
                </>
            }
            }
        </PageOffsetContext.Consumer>
    );
}

export const TranscriptionPanel = () => {
    return (<QueryClientProvider key="query_provider" client={PanelQueryClient}>
        <Wrapper key='panel' />
    </QueryClientProvider>);
}

const handlePageChange = (currentPage: number) => {
    document.querySelector(".paginationElement.active")?.classList.remove('active');
    document.querySelector(`.paginationElement:nth-child(${currentPage + 1})`)?.classList.add('active');
}

function Panel(props: IPanelProps) {
    const [dataOffset, setDataOffset]: [number, React.Dispatch<React.SetStateAction<number>>] = useState(props['offset']);
    let { data, isLoading, error, refetch, remove } = useQuery('getLines', async () => {
        return await fetch(`${API_ADDRESS}/get_lines?limit=${props['elementsPerPage']}&offset=${dataOffset}`, {
            "method": "GET",
            "headers": {
                "Accept": "application/json",
            }
        }).then((res) => res.json()).then((data) => data).catch((error) => error)
    }, { "refetchOnWindowFocus": false, "refetchOnMount": false, "refetchOnReconnect": false })

    useEffect(() => {
        keyboardjs.pause()
        refetch();
        keyboardjs.resume()
        return () => {
            remove();
            keyboardjs.reset();
        }
    }, [dataOffset, refetch, remove]);
    if (isLoading) {
        return <div> Lolding data... </div>
    }
    if (error) {
        return <div> {error} </div>
    }
    keyboardjs.bind('ctrl+.', (event: any) => {
        event.preventDefault();

        const newPageOffset = dataOffset + props['elementsPerPage'];
        const newPage = newPageOffset / props['elementsPerPage'];
        console.log(newPage);
        handlePageChange(newPage);
        setDataOffset(newPageOffset);
        return false;
    })
    keyboardjs.bind('ctrl+2', (event: any) => {
        event.preventDefault();
        let currentFocusedElementOrderId = document.activeElement?.parentElement?.getAttribute('data-ordering');
        if (currentFocusedElementOrderId === null) {
            currentFocusedElementOrderId = document.activeElement?.parentElement?.parentElement?.getAttribute('data-ordering');
        }
        if (currentFocusedElementOrderId === null) {
            return;
        }
        const selectElement: HTMLSelectElement | null = document.querySelector(`div[data-ordering="${currentFocusedElementOrderId}"] textarea`)
        selectElement?.focus();
        return false;
    })
    keyboardjs.bind('ctrl+3', (event: any) => {
        event.preventDefault();
        let currentFocusedElementOrderId = document.activeElement?.parentElement?.getAttribute('data-ordering');
        if (currentFocusedElementOrderId === null) {
            currentFocusedElementOrderId = document.activeElement?.parentElement?.parentElement?.getAttribute('data-ordering');
        }
        if (currentFocusedElementOrderId === null) {
            return;
        }
        const selectElement: HTMLSelectElement | null = document.querySelector(`div[data-ordering="${currentFocusedElementOrderId}"] select`)
        selectElement?.focus();
        return false;
    })

    return (
        <PageOffsetContext.Provider value={[dataOffset, setDataOffset]}>
            <div id='lines'>
                {data.map((el: any, index: number) => <div data-ordering={index} data-id={el['bindings_id']} className='line' key={`con_${el['audio_name']}_${index}`}>
                    <span key={`sp_${el['audio_name']}`} className='audio_name'> {el['audio_name']}</span>
                    <WaveAudio key={`wa_${el['audio_name']}_${index}`} index={index} audio_name={el['audio_name']} audio_dir={el['audio_directory']} />
                    <Transcript key={`tr_${el['audio_name']}_${index}`} transcript={el['transcript']} index={index} />
                    <Category key={`cat_${el['audio_name']}_${index}`} currentCategory={el["category_name"]} id={el["category_id"]} />
                </div>)}
            </div>


        </PageOffsetContext.Provider>
    )
}

function Transcript(props: ITranscriptProps) {
    const [text, setText] = useState(props["transcript"]);

    const handleChange = async (ev: React.ChangeEvent<HTMLTextAreaElement>) => {

        setText(ev.currentTarget.value);
        return false;
    };
    const handleBlur = async (ev: React.FocusEvent<HTMLTextAreaElement>) => {
        setText(ev.target.value);
        const bindingId = ev.currentTarget.parentElement?.getAttribute("data-id");
        const res = await fetch(`${API_ADDRESS}/texts`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                text: text,
                bindings_id: Number(bindingId),
            }),
        })
            .then((res) => res.json())
            .catch((err) => err);
        return false;
    };
    const specialCharacters = ["ř"]
    const handleSpecialCharacters = (ev: React.MouseEvent<HTMLButtonElement>) => {
        const character = ev.currentTarget.getAttribute("data-character");
        setText(text + character);
        const textareaElement = document.querySelector(`.transcript[tabindex="${props["index"] + 1}"]`) as HTMLTextAreaElement;
        textareaElement.focus();
    }
    return (
        <div className='transcript_area'>
            <textarea
                title="Transkrpcja"
                value={text}
                onChange={handleChange}
                onBlur={handleBlur}
                tabIndex={props["index"] + 1}
                className="transcript"

            ></textarea>
            <div className='special_char_container' >
                {specialCharacters.map(el => <button tabIndex={-1} key={el} className="special_character" data-character={el} onClick={handleSpecialCharacters}>{el}</button>)}
            </div>
        </div>
    );
}

function Category(props: ICategoryProps) {
    const { id, currentCategory } = props;
    const refCategoryID = useRef(id)
    const { isLoading, error, data, refetch } = useQuery("get_category", async () => {
        const res = await fetch(`${API_ADDRESS}/categories`);
        return await res.json();
    });

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
        refCategoryID.current = ev.target.value;
        const bindingId = ev.currentTarget.parentElement.getAttribute("data-id");
        const categoryId = ev.target.value;
        const res = await fetch(`${API_ADDRESS}/set_category`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                category_id: categoryId,
                bindings_id: bindingId
            }),
        })
            .then((res) => res.json())
            .catch((err) => err);
        console.log("Dane: ", res);
        return;
    };
    const handleClick = () => {
        refetch()
        return;
    };
    const categories = data.map((category: any, index: number) => (
        <option key={`option_${category["id"]}_${index}`} value={category["id"]}>
            {category["name"].trim()}
        </option>
    ));
    return (
        <QueryClientProvider key="cat_query_provider" client={CategoryQueryClient}>
            <select
                title="Kategorie głosów"
                onChange={handleChange}
                onClick={handleClick}
                defaultValue={id}
                className="category"
                ref={refCategoryID}
            >
                {categories}
            </select>
        </QueryClientProvider>
    );
}

function Pagination(props: IPaginationProps) {
    const [pageOffset, setDataOffset] = usePageOffsetContext();
    const { elementsPerPage } = props;
    const currentPage = pageOffset / elementsPerPage;
    const { data, isLoading, remove } = useQuery('amountOfLines', async () => {
        return await fetch(`${API_ADDRESS}/get_size`, {
            "method": "GET",
            "headers": {
                "Accept": "application/json",
            }
        }).then(response => response.json()).then(data => data['count_1']).catch(error => error)
    }, {
        "keepPreviousData": true
    })
    if (isLoading) {
        return <p> Loading pages</p>
    }

    const handleClick = (ev: React.MouseEvent<HTMLDivElement>) => {
        document.querySelectorAll('.paginationElement').forEach((el) => el.classList.remove('active'))
        const offset = Number(ev.currentTarget.getAttribute('data-offset'));
        setDataOffset(offset);
        ev.currentTarget.classList.add('active');

    }
    const steps = Math.floor(data / elementsPerPage);
    const pages = Array(steps).fill(0).map((el: number, index: number) =>
        <div className={`paginationElement ${index === currentPage ? 'active' : ''}`} onClick={handleClick} data-page={index} data-offset={index * elementsPerPage} key={`page_${index * elementsPerPage}`}>
            <span> {index + 1} </span>
        </div>);

    // console.log(pages);
    return (
        <div id='pagination' className='pages' data-max-offset={steps * elementsPerPage}>{pages}</div>);
}

function WaveAudio(props: IWaveAudioProps) {
    const waveAudioRef = useRef({} as WaveSurfer);
    const audioContainerRef = useRef({} as HTMLElement);
    const playAudioToggle = () => {
        if (!waveAudioRef.current.isPlaying()) {
            waveAudioRef.current.play();
            return;
        }
        waveAudioRef.current.pause();
        return;
    };
    const pauseAudio = () => {
        waveAudioRef.current.pause();
        return;
    }
    const handleClick = playAudioToggle;
    keyboardjs.bind('ctrl+1', (event: any) => {
        event.preventDefault();
        let currentFocusedElementOrderId = document.activeElement?.parentElement?.getAttribute('data-ordering');
        if (currentFocusedElementOrderId === null) {
            currentFocusedElementOrderId = document.activeElement?.parentElement?.parentElement?.getAttribute('data-ordering');
        }
        let outerAudioContainerId;

        const audioContainerId = audioContainerRef.current.getAttribute('data-ordering');
        outerAudioContainerId = audioContainerId;


        if (currentFocusedElementOrderId === outerAudioContainerId && outerAudioContainerId !== null && currentFocusedElementOrderId !== null) {
            playAudioToggle();
            document.activeElement?.removeEventListener('blur', pauseAudio);
            document.activeElement?.addEventListener('blur', pauseAudio);
        }
        return false;
    })

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
        waveform.load(pathToFile);
        waveAudioRef.current = waveform;
        return () => {
            waveform.destroy();
            keyboardjs.reset();
        };
    })
    return <div id={`waveform_${props["index"]}`} data-ordering={props["index"]} onClick={handleClick}></div>;
};