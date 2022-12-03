import React from 'react';
import { useRef, useState } from 'react';
import './FinalisationPanel.sass';

import useTranscriptFormatter from '../../hooks/useTranscriptFormatter';
import useConfig from '../../hooks/useConfig';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useBetween } from 'use-between';
const API_ADDRESS = 'http://localhost:5002';

const ConfigClient = new QueryClient();

type FinalisationStates = 'None' | 'Executing' | 'Finished' | 'Error';

const useFinaliseRes = () => {
  const [finaliseState, setFinaliseState] = useState(
    'None' as FinalisationStates
  );
  const errorColors = {
    None: 'default',
    Executing: 'executing',
    Finished: 'finished',
    Error: 'error',
  };
  const messages = {
    None: 'Jestem gotowy!',
    Executing: 'Robię!',
    Finished: 'I po sprawie...',
    Error: 'Błąd, tylko jaki?',
  };
  return {
    messages,
    colors: errorColors,
    finaliseState,
    setFinaliseState,
  };
};
const useSharedFinaliseRes = () => useBetween(useFinaliseRes);

export const FinalisationPanel = (props: any) => (
    <QueryClientProvider
      key='config_query_provider'
      client={ConfigClient}
    >
      <Wrapper />
    </QueryClientProvider>
  );
function Wrapper() {
  const { setFinaliseState } = useSharedFinaliseRes();
  const { isLoading, data } = useConfig();
  if (isLoading) {
    return <div className='card'> Loading</div>;
  }
  const finaliseData = data['finalisationRecent'];
  const handleSubmit = async (ev: React.MouseEvent<HTMLFormElement>) => {
    ev.preventDefault();
    setFinaliseState('Executing');
    const formData = new FormData(ev.currentTarget);
    const res = await fetch(`${API_ADDRESS}/finalise`, {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(formData)),
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => response.json())
      .then((resData) => {
        setFinaliseState('Finished');
        return resData;
      })
      .catch((err) => {
        setFinaliseState('Error');
        return err;
      });
    console.log(res);
  };
  return (
    <form
      id='FinalisationPanel'
      className='card__container'
      onSubmit={handleSubmit}
    >
      <OutputFormat />
      <AudioLengthRanges
        minLength={finaliseData['audioLengthFilter']['minLength']}
        maxLength={finaliseData['audioLengthFilter']['maxLength']}
        invalidsDir={finaliseData['audioLengthFilter']['invalidsDir']}
      />
      <ExportTypeConfig />
      <LineFormat lineFormat={finaliseData['lineFormat']['format']} />
      <Consequences />
      <Decisions />
    </form>
  );
}

function OutputFormat(props: any) {
  const [channels, setChannels] = useState(1);
  const [sampleRate, setSampleRate] = useState(22050);
  const [audioFilter, setAudioFilter] = useState('');
  const [outputType, setOutputType] = useState('wav');

  const handleInputChannels = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    setChannels(Number.parseInt(ev.currentTarget.value));
  };
  const handleInputSampleRate = (
    ev: React.KeyboardEvent<HTMLInputElement>
  ) => {
    setSampleRate(Number.parseInt(ev.currentTarget.value));
  };
  const handleInputAudioFilter = (
    ev: React.KeyboardEvent<HTMLInputElement>
  ) => {
    setAudioFilter(ev.currentTarget.value);
  };
  const handleInputOutputType = (
    ev: React.KeyboardEvent<HTMLInputElement>
  ) => {
    setOutputType(ev.currentTarget.value);
  };
  return (
    <div
      id='simpleFfmpegConstructor'
      className='card'
    >
      <p className='card__title'> Parametry formatowania FFmpeg </p>
      <label htmlFor='output_channels'> Ilość kanałów (-ac)</label>
      <input
        type='number'
        className='card__input'
        onInput={handleInputChannels}
        name='output_channels'
        id='output_channels'
        min='1'
        title='Wyjściowa ilośc kanałów'
        value={channels}
      />

      <label htmlFor='output_sample_rate'> Częstotliwość dźwięku (-ar)</label>
      <input
        type='number'
        className='card__input'
        onInput={handleInputSampleRate}
        name='output_sample_rate'
        id='output_sample_rate'
        min='1'
        title='Wyjściowa częstotliwość próbkowania'
        value={sampleRate}
      />

      <label htmlFor='output_audio_filter'> Dodatkowe filtry audio (-af)</label>
      <input
        type='text'
        className='card__input'
        onInput={handleInputAudioFilter}
        name='output_audio_filter'
        id='output_audio_filter'
        title='Wyjściowy filtr audio'
        value={audioFilter}
      />

      <label htmlFor='output_type'> Docelowy typ (rozszerzenie)</label>
      <input
        type='text'
        className='card__input'
        onInput={handleInputOutputType}
        name='output_type'
        id='output_type'
        title='Rozszerzenie wyjściowego audio. Domyślnie wav'
        value={outputType}
      />
    </div>
  );
}

function AudioLengthRanges({ minLength, maxLength, invalidsDir }: any) {
  const refMinLength = useRef(minLength);
  const refMaxLength = useRef(maxLength);

  return (
    <div
      id='audioLengthRanges'
      className='card'
    >
      <p className='card__title'> Filtr długości audio </p>
      <label htmlFor='min_length'> Minimalna długość pliku audio [s] </label>
      <input
        type='number'
        ref={refMinLength}
        id='min_length'
        defaultValue={minLength}
        name='min_length'
        min='0'
        className='card__input'
        title='Minimalna długość audio'
      />
      <label htmlFor='max_length'> Maksymalna długość pliku audio [s] </label>
      <input
        type='number'
        ref={refMaxLength}
        id='max_length'
        defaultValue={maxLength}
        name='max_length'
        min='0'
        className='card__input'
        title='Maksymalna długość audio'
      />
    </div>
  );
}

function ExportTypeConfig(props: any) {
  return (
    <div
      id='exportTypeConfig'
      className='card'
    >
      <p className='card__title'> Typ eksportu </p>
      <select
        name='export_method'
        className='card__input'
      >
        <option value='enderal-finalise'> Enderal </option>
        <option value='to_one_folder'>
          Każda kategoria do jednego folderu
        </option>
        <option value='distinctive'>Każda kategoria do osobnego folderu</option>
      </select>
    </div>
  );
}

function LineFormat(props: any) {
  const [lineFormat, setLineFormat] = useState(props['lineFormat']);
  const handleInput = (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const newValue = ev.currentTarget.value;
    setLineFormat(newValue);
  };
  return (
    <div
      id='lineFormat'
      className='card'
    >
      <p className='card__title'> Format linijki </p>
      <label htmlFor='line_format_input'> Format linijki w transkrypcji </label>
      <textarea
        id='line_format_input'
        className='card__input card__input__textarea'
        onInput={handleInput}
        value={lineFormat}
        name='line_format_input'
      />
      <ExampleLine text={lineFormat} />
    </div>
  );
}

/* There, user decides, if they want to use additional things like formatting, filtering and to finalise project */
function Decisions(props: any) {
  const { messages, colors, finaliseState } = useSharedFinaliseRes();
  return (
    <div
      id='decision'
      className='card'
    >
      <p className='card__title'> Zatwierdzenie finalizacji </p>
      <label htmlFor='should_filter'> Filtruj długość </label>
      <input
        type='checkbox'
        name='should_filter'
        id='should_filter'
        title='Uwzględnij filtr długości audio'
      />
      <label htmlFor='should_format'> Formatuj pliki audio </label>
      <input
        type='checkbox'
        name='should_format'
        id='should_format'
        title='Dodatkowo formatuje pliki audio'
      />
      <button
        className={`card__input card__input__button ${colors[finaliseState]}`}
        disabled={finaliseState === 'Executing'}
      >
        Finalizuj
      </button>
      <p> {messages[finaliseState]}</p>
    </div>
  );
}

function ExampleLine({ text }: { text: string }) {
  const formatter = useTranscriptFormatter();
  formatter.format(text as string);
  return (
    <>
      <label htmlFor='lineExample'> Przykład linijki </label>
      <textarea
        id='lineExample'
        className='card__input card__input__textarea'
        readOnly
        value={formatter.format(text)}
      />
    </>
  );
}

function Consequences(props: any) {
  return (
    <div className='card'>
      <p className='card__title'> Konsekwencje wyborów </p>
    </div>
  );
}
