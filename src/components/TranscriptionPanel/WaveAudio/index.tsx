import React from 'react';
import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import keyboardjs from 'keyboardjs';
import './style.sass';

const icons = {
  'play': '\ue034',
  'pause': '\ue037',
  'stop': '\ue047',
};
interface IWaveAudioProps {
  index: number;
  audio_name: string;
  audio_dir: string;
}

export function WaveAudio(props: IWaveAudioProps) {
  const waveAudioRef = useRef({} as WaveSurfer | null);
  const audioContainerRef = useRef({} as HTMLElement);
  const audioPlayElement = useRef({} as HTMLSpanElement);

  const stopAudio = () => {
    waveAudioRef.current?.stop();
  };
  const playAudio = () => {
    waveAudioRef.current?.play();
  };
  const playAudioToggle = () => {
    console.dir(waveAudioRef.current);
    if (waveAudioRef.current?.isPlaying()) {
      console.log('Playing. Pause the audio.');
      waveAudioRef.current.pause();
      return;
    }
    console.log('Not playing. Start the audio');
    waveAudioRef.current?.play();
    return;
  };
  const pauseAudio = () => {
    waveAudioRef.current?.pause();
    return;
  };

  const isCurrentContainer = () => {
    /**
     * Restricts keyboard binds to current container and checks if audio can be launched.
     * It isn't pleasant if you hear every audio at once
     */
    if (waveAudioRef.current === null) {
      return false;
    }
    if (!waveAudioRef.current.isReady) {
      return false;
    }
    let currentFocusedElementOrderId =
      document.activeElement?.parentElement?.getAttribute('data-ordering');
    if (currentFocusedElementOrderId === null) {
      currentFocusedElementOrderId =
        document.activeElement?.parentElement?.parentElement?.getAttribute(
          'data-ordering'
        );
    }
    const outerAudioContainerId =
      audioContainerRef.current.parentElement?.getAttribute('data-ordering');
    return (
      outerAudioContainerId === currentFocusedElementOrderId &&
      outerAudioContainerId !== null
    );
  };

  keyboardjs.bind('ctrl+1', (event: any) => {
    event.preventDefault();
    if (isCurrentContainer()) {
      playAudioToggle();
      document.activeElement?.removeEventListener('blur', pauseAudio);
      document.activeElement?.addEventListener('blur', pauseAudio);
    }
    return false;
  });

  keyboardjs.bind('ctrl+r', (event: any) => {
    event.preventDefault();
    if (isCurrentContainer()) {
      waveAudioRef.current?.stop();
    }
    return false;
  });
  keyboardjs.bind('ctrl+;', (event: any) => {
    event.preventDefault();
    if (isCurrentContainer()) {
      waveAudioRef.current?.skipBackward(0.5);
    }
  });
  useEffect(() => {
    const audioElement = document.querySelector(
      `#waveform_${props['index']}`
    ) as HTMLDivElement;
    audioPlayElement.current = document.querySelector(
      `#waveform_${props['index']} .audio_play`
    ) as HTMLSpanElement;
    audioContainerRef.current = audioElement;

    const waveform = new WaveSurfer({
      'container': audioElement,
      'waveColor': '#444',
      'progressColor': '#111',
      'responsive': true,
      'backgroundColor': '#555',
    }).init();

    waveform.on('error', (err) => {
      console.log('Błąd: ', err);
    });
    waveform.on('play', () => {
      audioPlayElement.current.innerText = icons['play'];
    });
    waveform.on('pause', () => {
      audioPlayElement.current.innerText = icons['pause'];
    });
    waveform.on('finished', () => {
      audioPlayElement.current.innerText = icons['pause'];
    });

    const pathToFile = `${props['audio_dir']}/${props['audio_name']}`;
    console.log(pathToFile);
    waveform.load(pathToFile);

    waveAudioRef.current = waveform;
    audioContainerRef.current.addEventListener('click', playAudioToggle);
    audioPlayElement.current.addEventListener('click', playAudioToggle);
    return () => {
      audioContainerRef.current.removeEventListener('click', playAudioToggle);
      audioPlayElement.current.removeEventListener('click', playAudioToggle);
      waveAudioRef.current?.destroy();
      waveAudioRef.current?.unAll();
      // Memory leak fix
      Reflect.deleteProperty(waveAudioRef.current as WaveSurfer, 'backend');
      waveAudioRef.current = null;
      Reflect.deleteProperty(waveAudioRef, 'current');
    };
  });

  return (
    <>
      <div
        className='waveform'
        id={`waveform_${props['index']}`}
        data-ordering={props['index']}
        key={`wav_cont_${props['index']}`}
      >
        <div className='waveform__options'>
          <span
            className='waveform__option material-symbols-outlined audio_play'
            key={`wav_button_toggle_${props['index']}`}
            onClick={() => playAudioToggle()}
            title={'Uruchom / Zatrzymaj odtwarzanie - Ctrl + 1'}
          >
            {icons['pause']}
          </span>
          <span
            className='waveform__option material-symbols-outlined audio_stop'
            key={`wav_button_stop_${props['index']}`}
            onClick={() => stopAudio()}
            title={'Zatrzymaj i wskaźnik na początek - Ctrl + r'}
          >
            {icons['stop']}
          </span>
        </div>
      </div>
    </>
  );
}
