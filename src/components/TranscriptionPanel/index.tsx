import './style.css'

import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";

import WaveSurfer from "wavesurfer.js";
// @ts-ignore
import keyboardjs from 'keyboardjs';

// Hooks
import useConfig from '../../hooks/useConfig'
import { useFilterByCategory, useSharedFilterCategory } from '../../hooks/useFilterByCategory';
import { useBetween, free } from 'use-between'
import { useStateIfMounted } from 'use-state-if-mounted'

// Types
import type { configAPIData } from '../../../type'
import type { IPanelProps } from "./types/IPanelProps";
import type { ITranscriptProps } from "./types/ITranscriptProps";
import type { ICategoryProps } from "./types/ICategoryProps";
import type { IPaginationProps } from "./types/IPaginationProps";
import type { IWaveAudioProps } from "./types/IWaveAudioProps";

import { SidePanel } from './SidePanel'
const API_ADDRESS = 'http://localhost:5002';

const PanelQueryClient = new QueryClient();
const CategoryQueryClient = new QueryClient();

const useOffsetData = () => {
    const [offset, setOffset] = useStateIfMounted(0);
    const [maxOffset, setMaxOffset] = useStateIfMounted(0);
    return {
        maxOffset,
        setMaxOffset,
        offset,
        setOffset
    }
}

const useSharedOffsetState = () => useBetween(useOffsetData,);



const Wrapper = () => {
    const config = useConfig();

    if (config.isLoading) {
        return <p> Lolding config.</p>
    }

    const configData = config.data as configAPIData.RootObject;
    const workspaceConfig = configData['workspaceConfig'];

    return (<>
        <section id='Panel'>
            <MainPanel elementsPerPage={workspaceConfig['elementsPerPage']} config={configData} />
            <SidePanel />
        </section>
        <Pagination key='pagination' elementsPerPage={workspaceConfig['elementsPerPage']} />
    </>
    );
}

export const TranscriptionPanel = () => {
    useEffect(() => {
        return () => {
        }
    })
    return (<QueryClientProvider key="query_provider" client={PanelQueryClient}>
        <Wrapper key='panel' />
    </QueryClientProvider>);
}

const handlePageChange = (currentPage: number) => {
    console.log(currentPage);
    document.querySelector(".paginationElement.active")?.classList.remove('active');
    document.querySelector(`.paginationElement:nth-child(${currentPage + 1})`)?.classList.add('active');
}
interface ILineFromAPI {
    audio_directory: string;
    audio_name: string;
    bindings_id: number;
    category_id: number;
    category_name: string;
    transcript: string;
}
type dataFromAPI = ILineFromAPI[]

function MainPanel(props: IPanelProps) {
    const { maxOffset, offset, setOffset } = useSharedOffsetState();
    const { filterCategory } = useSharedFilterCategory();
    let { data, isLoading, error, refetch, remove } = useQuery([offset, filterCategory], async () => {
        return await fetch(`${API_ADDRESS}/get_lines?limit=${props['elementsPerPage']}&offset=${offset}&category_id=${filterCategory}`, {
            "method": "GET",
            "headers": {
                "Accept": "application/json",
            }
        }).then((res) => res.json()).then((data) => { handlePageChange(offset / props['elementsPerPage']); return data }).catch((error) => error)
    }, { "refetchOnWindowFocus": false, "refetchOnReconnect": false, "refetchOnMount": false, "cacheTime": 0})
    let data2: dataFromAPI = data;
    useEffect(() => {
        return () => {
            remove();
        }
    }, []);
    if (isLoading) {
        return <div> Lolding data... </div>
    }
    if (error) {
        return <div> {error} </div>
    }
    console.log(offset);
    keyboardjs.bind('ctrl+.', (event: any) => {

        event.preventDefault();

        const newPageOffset = offset + props['elementsPerPage'];
        console.log(newPageOffset, maxOffset);
        if (newPageOffset >= maxOffset) {
            return;
        }
        const newPage = newPageOffset / props['elementsPerPage'];

        handlePageChange(newPage);
        setOffset(newPageOffset);

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
        <div id='lines'>
            {data2.map((el: any, index: number) => <div data-ordering={index} data-id={el['bindings_id']} className='line' key={`con_${el['audio_name']}_${index}`}>
                <span key={`sp_${el['audio_name']}`} className='audio_name'> {el['audio_name']}</span>
                <WaveAudio key={`wa_${el['audio_name']}_${index}`} index={el['bindings_id']} audio_name={el['audio_name']} audio_dir={el['audio_directory']} />
                <Transcript key={`tr_${el['audio_name']}_${index}`} transcript={el['transcript']} index={index} spellcheck={props['config']['workspaceConfig']['spellcheck']} />
                <Category key={`cat_${el['audio_name']}_${index}`} currentCategory={el["category_name"]} id={el["category_id"]} />
            </div>)}
        </div>

    )
}

function Transcript(props: ITranscriptProps) {
    const [text, setText] = useStateIfMounted(props["transcript"]);

    const handleChange = async (ev: React.ChangeEvent<HTMLTextAreaElement>) => {

        setText(ev.currentTarget.value);
        return false;
    };
    const handleBlur = async (ev: React.FocusEvent<HTMLTextAreaElement>) => {
        setText(ev.target.value);
        const bindingId = ev.currentTarget.parentElement?.parentElement?.getAttribute("data-id");
        console.log(bindingId)
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
            .then(data => data)
            .catch((err) => err);
        console.log(res);
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
                spellCheck={props['spellcheck']}
            ></textarea>
            <div className='special_char_container' >
                {specialCharacters.map(el => <button tabIndex={-1} key={el} className="special_character" data-character={el} onClick={handleSpecialCharacters}>{el}</button>)}
            </div>
        </div>
    );
}

function Category(props: ICategoryProps) {
    const { id, currentCategory } = props;
    const [category, setCategory] = useStateIfMounted(id)
    const { isLoading, error, data, refetch, remove } = useQuery("get_category", async () => {
        const res = await fetch(`${API_ADDRESS}/categories`);
        return await res.json();
    }, { "cacheTime": 0 });
    useEffect(() => () => {
        remove();
    }, [remove])
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
        console.log(ev.target.value)
        const bindingId = ev.currentTarget.parentElement.getAttribute("data-id");
        const categoryId = ev.target.value;
        setCategory(categoryId);
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

        return;
    };
    const handleClick = (ev: React.PointerEvent<HTMLSelectElement>) => {
        refetch()

        return;
    };
    const handleCopy = (ev: React.ClipboardEvent) => {
        console.log(ev);
    }
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
                onCopy={handleCopy}
                value={category}
                className="category"
            >
                {categories}
            </select>
        </QueryClientProvider>
    );
}

function Pagination(props: IPaginationProps) {
    const { maxOffset, setMaxOffset, offset, setOffset } = useSharedOffsetState();
    const { filterCategory } = useSharedFilterCategory();
    const { elementsPerPage } = props;
    const currentPage = 0 / elementsPerPage;
    const { data, isLoading, remove } = useQuery([filterCategory], async () => {
        return await fetch(`${API_ADDRESS}/get_size?category_id=${filterCategory}`, {
            "method": "GET",
            "headers": {
                "Accept": "application/json",
            }
        }).then(response => response.json()).then(data => data['count_1']).catch(error => error)
    })
    useEffect(() => () => {
        remove();
        free(useSharedFilterCategory)
        free(useSharedOffsetState);
    }, [remove, free])
    if (isLoading) {
        return <p> Loading pages</p>
    }
    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault()
        const newOffset = Number(event.currentTarget.getAttribute('data-offset'))
        setOffset(newOffset);
        return false;
    }
    const steps = Math.floor(data / elementsPerPage);
    const pages = Array(steps).fill(0).map((el: number, index: number) =>

        <div className={`paginationElement ${index === currentPage ? 'active' : ''}`} onClick={handleClick} data-page={index} data-offset={index * elementsPerPage} key={`page_${index * elementsPerPage}`}>
            <span> {index + 1} </span>
        </div>
    )
    setMaxOffset(steps * elementsPerPage)
    // console.log(pages);
    return (
        <div id='pagination' className='pages' data-max-offset={steps * elementsPerPage}>{pages}</div>
    )
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
    const isCurrentContainer = () => {
        /**
         * Restricts keyboard binds to current container and checks if audio can be launched.
         */
        if (waveAudioRef.current === null) {
            return false;
        }
        if (!waveAudioRef.current.isReady) {
            return false;
        }
        let currentFocusedElementOrderId = document.activeElement?.parentElement?.getAttribute('data-ordering');
        if (currentFocusedElementOrderId === null) {
            currentFocusedElementOrderId = document.activeElement?.parentElement?.parentElement?.getAttribute('data-ordering');
        }
        let outerAudioContainerId = audioContainerRef.current.parentElement?.getAttribute('data-ordering');
        // console.table([["audioContainerRef", audioContainerRef.current, Boolean(audioContainerRef.current), ], ["waveAudioRef", waveAudioRef, Boolean(waveAudioRef.current)]])
        return outerAudioContainerId === currentFocusedElementOrderId && outerAudioContainerId !== null; 
    }
    keyboardjs.bind('ctrl+1', (event: any) => {
        event.preventDefault();
        if (isCurrentContainer()) {

            playAudioToggle();
            document.activeElement?.removeEventListener('blur', pauseAudio);
            document.activeElement?.addEventListener('blur', pauseAudio);
        }
            
        return false;
    })

    keyboardjs.bind('ctrl+r', (event: any) => {
        event.preventDefault();
        if (isCurrentContainer()) {
            waveAudioRef.current.stop()
        }
        return false;
    })
    useEffect(() => {
        const audioElement = document.querySelector(
            `#waveform_${props["index"]}`
        ) as HTMLElement;
        audioContainerRef.current = audioElement;
        const waveform = new WaveSurfer({
            "container": audioElement,
            "waveColor": "#0569ff",
            "progressColor": "#0353cc",
            "responsive": true,
            "closeAudioContext": true,
            "drawingContextAttributes": {
                "desynchronized": true
            }
        })

        waveform.init();

        waveform.on("error", (err) => {
            console.log("Błąd: ", err)
        })

        const pathToFile = `${props['audio_dir']}/${props["audio_name"]}`.replaceAll('\\', '/')
        waveform.load(pathToFile);
        waveAudioRef.current = waveform
        return () => {

            waveAudioRef.current.destroy();
            //@ts-ignore
            waveAudioRef.current.backend = null;
            //@ts-ignore
            delete waveAudioRef.current.backend
            //@ts-ignore
            waveAudioRef.current = null;
            
            audioContainerRef.current.remove();
        };
    }, [props['audio_name']])
    return <div id={`waveform_${props["index"]}`} data-ordering={props["index"]} onClick={handleClick}></div>;
};