import React, { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import keyboardjs from 'keyboardjs';
import { IWaveAudioProps } from "../types/IWaveAudioProps";
import './style.sass'
import { useStateIfMounted } from "use-state-if-mounted";
import  useIsMounted  from 'ismounted'
import { useHotkeys } from 'react-hotkeys-hook'

export function WaveAudio(props: IWaveAudioProps) {
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