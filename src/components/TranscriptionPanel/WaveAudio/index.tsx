import React, { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import keyboardjs from 'keyboardjs';
import { IWaveAudioProps } from "../types/IWaveAudioProps";
import './style.sass'
import { useStateIfMounted } from "use-state-if-mounted";
import  useIsMounted  from 'ismounted'
import { useHotkeys } from 'react-hotkeys-hook'

export function WaveAudio(props: IWaveAudioProps) {
    const isMounted = useIsMounted();
    const waveAudioRef = useRef({} as WaveSurfer);
    const audioContainerRef = useRef({} as HTMLElement);
    const [isPlaying, setIsPlaying] = useStateIfMounted(false);

    const stopAudio = () => {
        waveAudioRef.current.stop();
        setIsPlaying(false);
    }
    const playAudioToggle = () => {

        if (!waveAudioRef.current.isPlaying()) {
            waveAudioRef.current.play();
            setIsPlaying(true)
            return;
        }
        waveAudioRef.current.pause();
        setIsPlaying(false)
        return;
    };
    const pauseAudio = () => {
        waveAudioRef.current.pause();
        setIsPlaying(false)
        return;
    };
    const handleClick = playAudioToggle;
    // useHotkeys('ctrl+1', (event) => {
    //     event.preventDefault();
    //     if (isCurrentContainer()) {
    //         playAudioToggle();
    //         document.activeElement?.removeEventListener('blur', pauseAudio);
    //         document.activeElement?.addEventListener('blur', pauseAudio);
    //     }
    // })
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
        const audioElement  = document.querySelector(
            `#waveform_${props["index"]}`
        ) as HTMLDivElement;
        audioElement.addEventListener("click", playAudioToggle);
        audioContainerRef.current = audioElement;
        const waveform = new WaveSurfer({
            "container": audioElement,
            "waveColor": "#0569ff",
            "progressColor": "#0353cc",
            "responsive": true
        });

        waveform.init();

        waveform.on("error", (err) => {
            console.log("Błąd: ", err);
        });
        waveform.on("play", () => {
            setIsPlaying(true)
        })
        waveform.on("pause", () => {
            setIsPlaying(false)
        })
        waveform.on("finished", () => {
            setIsPlaying(false);
        })
        const pathToFile = `${props['audio_dir']}/${props["audio_name"]}`.replaceAll('\\', '/');
        waveform.load(pathToFile);
        waveAudioRef.current = waveform;
        return () => {
            console.log('destructor');
            waveAudioRef.current.destroy();
            
            //@ts-ignore
            waveAudioRef.current.backend = null;
            //@ts-ignore
            waveAudioRef.current = null;
        };
    }, [props['audio_name']]);
    return <>
        <div className='waveform' id={`waveform_${props["index"]}`} data-ordering={props["index"]} key={ `wav_cont_${props['index']}`}>
        <div className='waveform__options'>
            <span className="waveform__option material-symbols-outlined" key={ `wav_button_toggle_${props['index']}`} onClick={() => playAudioToggle()} title={"Uruchom / Zatrzymaj odtwarzanie - Ctrl + 1"}> {!isPlaying ? "\ue037": "\ue034"} </span>
            <span className="waveform__option material-symbols-outlined" key={ `wav_button_stop_${props['index']}`}  onClick={() => stopAudio()} title={"Zatrzymaj i wskaźnik na początek - Ctrl + r"}> {"\ue047"} </span>
        </div>
        </div>
        
    </>;


}
;
