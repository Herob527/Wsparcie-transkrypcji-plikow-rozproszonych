import { useState } from 'react'
import './FinalisationPanel.css'

import useTranscriptFormatter from '../../hooks/useTranscriptFormatter'
import useFFmpegConstructor from '../../hooks/useFFmpegConstructor'
import useConfig from '../../hooks/useConfig'
import { QueryClient, QueryClientProvider } from 'react-query'

const API_ADDRESS = 'http://localhost:5002';

const ConfigClient = new QueryClient();



export const FinalisationPanel = (props: any) => {
    return (
        <QueryClientProvider key="config_query_provider" client={ConfigClient}>
            <Wrapper />
        </QueryClientProvider>

 )
}
function Wrapper() {
const {isLoading, data} = useConfig()
    if (isLoading) {
        return <div className='card'> Loading</div>;
    }
    const finaliseData = data["finalisationRecent"]
    const handleSubmit = async (ev: React.MouseEvent<HTMLFormElement>) => {
        ev.preventDefault();
        const formData = new FormData(ev.currentTarget);
        const res = await fetch(`${API_ADDRESS}/finalise`, {
            method: 'POST',
            body: JSON.stringify(Object.fromEntries(formData)),
            headers: { 'Content-Type': 'application/json'}
        }).then((response) => response.json()).then(data => data).catch((err) => err)
        console.log(res);
    }
    return (<form id='FinalisationPanel' className='card__container' onSubmit={handleSubmit}>
        
            <SimpleFfmpegConstructor />
            <AudioLengthRanges 
                minLength={finaliseData["audioLengthFilter"]["minLength"]} 
                maxLength={finaliseData["audioLengthFilter"]["maxLength"]}
                invalidsDir={finaliseData["audioLengthFilter"]["invalidsDir"]}
            />
            <ExportTypeConfig />
            <LineFormat />
            <Consequences />
            <Decisions />

    </form> )
}

function SimpleFfmpegConstructor(props: any) {
    const ffmpegConstrucor = useFFmpegConstructor()
    const [channels, setChannels] = useState(1);
    const [sampleRate, setSampleRate] = useState(22050);
    const [audioFilter, setAudioFilter] = useState("");
    const [outputType, setOutputType] = useState("wav");

    const handleInput_channels = (ev: React.KeyboardEvent<HTMLInputElement>) => {
        setChannels(Number.parseInt(ev.currentTarget.value));
    }
    const handleInput_sampleRate = (ev: React.KeyboardEvent<HTMLInputElement>) => {
        setSampleRate(Number.parseInt(ev.currentTarget.value));
    }
    const handleInput_audioFilter = (ev: React.KeyboardEvent<HTMLInputElement>) => {
        setAudioFilter(ev.currentTarget.value);
    }
    const handleInput_outputType = (ev: React.KeyboardEvent<HTMLInputElement>) => {
        setOutputType(ev.currentTarget.value);
    }
    return (
        <div id='simpleFfmpegConstructor' className='card'>
            <p className='card__title'> Konstruktor komendy FFmpeg </p>
            <label htmlFor='output_channels'> Ilość kanałów (-ac)</label>
            <input type='number' className='card__input' onInput={handleInput_channels} name='output_channels' id='output_channels' min='1' title='Wyjściowa ilośc kanałów' value={channels} />

            <label htmlFor='output_sample_rate'> Częstotliwość dźwięku (-ar)</label>
            <input type='number' className='card__input' onInput={handleInput_sampleRate} name='output_sample_rate' id='output_sample_rate' min='1' title='Wyjściowa częstotliwość próbkowania' value={sampleRate} />

            <label htmlFor='output_audio_filter'> Dodatkowe filtry (-af)</label>
            <input type='text' className='card__input' onInput={handleInput_audioFilter} name='output_audio_filter' id='output_audio_filter' title='Wyjściowy filtr audio' value={audioFilter}  />

            <label htmlFor='output_type'> Docelowy typ (rozszerzenie)</label>
            <input type='text' className='card__input' onInput={handleInput_outputType} name='output_type' id='output_type' title='Rozszerzenie wyjściowego audio. Domyślnie wav' value={outputType} />

            <label htmlFor='example_command'> Przykładowa Komenda </label>
            <textarea id='example_command' className='card__input card__input__textarea' readOnly value={ffmpegConstrucor.createCommand(channels, sampleRate, audioFilter, outputType)} />
        </div>
    )
}

function AudioLengthRanges({minLength, maxLength, invalidsDir} : any ) {

    return (
        <div id="audioLengthRanges" className='card'>
            <p className='card__title' > Filtr długości audio </p>
            <label htmlFor="min_length"> Minimalna długość pliku audio [s] </label>
            <input type="number" id='min_length' value={minLength} name='min_length' min='0' className='card__input' title='Minimalna długość audio' />
            <label htmlFor="max_length"> Maksymalna długość pliku audio [s] </label>
            <input type="number" id='max_length' value={maxLength } name='max_length' min='0' className='card__input' title='Maksymalna długość audio' />
            <label htmlFor="invalids_dir"> Nazwa folderu dla plików spoza podanego zakresu </label>
            <input type="text" id='invalids_dir' value={invalidsDir} name='invalids_dir' className='card__input' />
        </div>
    )
}

function ExportTypeConfig(props: any) {
    return (
        <div id='exportTypeConfig' className='card'>
            <p className='card__title'> Typ eksportu </p>
            <label htmlFor='only_text'> Eksport tylko tekstów </label>
            <input type='checkbox' id='only_text' name='only_text' title='Eksportuje wyłącznie transkrypt bez tykania audio' />
            <select name='export_method' className='card__input'>
                <option value='enderal-finalise'> Enderal </option>
                <option value='to_one_folder'> Każda kategoria do jednego folderu </option>
                <option value='distinctive'> Każda kategoria do osobnego folderu </option>
                
            </select>
        </div>
    )
}

function LineFormat(props: any) {
    const [lineFormat, setLineFormat] = useState("");
    const handleInput = (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const newValue = ev.currentTarget.value;

        setLineFormat(newValue);
    }
    return (
        <div id='lineFormat' className='card'>
            <p className='card__title'> Format linijki  </p>
            <label htmlFor='lineFormatInput'> Format linijki w transkrypcji </label>
            <textarea id="lineFormatInput" className='card__input card__input__textarea' onInput={handleInput} value={lineFormat} name='lineFormatInput' />
            <ExampleLine text={lineFormat} />
        </div>
    )
}

/* There, user decides, if they want to use additional things like formatting, filtering and to finalise project */
function Decisions(props: any) {
    return (
        <div id='decision' className='card'>
            <p className='card__title'> Zatwierdzenie finalizacji  </p>
            <label htmlFor='should_filter'> Filtruj długość  </label>
            <input type='checkbox' name='should_filter' id='should_filter' title='Uwzględnij filtr długości audio' />
            <label htmlFor='should_format'> Formatuj pliki audio </label>
            <input type='checkbox' name='should_format' id='should_format' title='Dodatkowo formatuje pliki audio' />
            <button className='card__input card__input__button'> Finalizuj </button>
        </div>
    )
}

function ExampleLine({text} : {text: string}) {
    
    const formatter = useTranscriptFormatter();
    formatter.format(text as string);
    return (
    <>            
        <label htmlFor='lineExample'> Przykład linijki </label>
        <textarea id="lineExample" className='card__input card__input__textarea' readOnly value={formatter.format(text)}/>
        </>);
}

function Consequences(props: any) {
    return (<div className='card'>
        <p className='card__title'> Konsekwencje wyborów </p>
    </div>)
}