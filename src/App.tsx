
import { useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query'


const queryClient = new QueryClient()

const API_ADDRESS = 'http://localhost:5002'

const fetchLines = async (offset: number = 0, limit: number = 30) => {
  const apiEndpoints = ['bindings', 'audios', 'texts'];
  let fetchedData: any = {};
  for (const endpoint of apiEndpoints) {
    const res: Array<any> = await fetch(`${API_ADDRESS}/${endpoint}?offset=${offset}&limit=${limit}`).then((res) => res.json());
    fetchedData[endpoint] = res;
  }
  let data = [];
  for (let index = 0; index < limit; index++) {
    const currentBinding = fetchedData['bindings'][index];
    const currentAudio = fetchedData['audios'][index];
    const currentText = fetchedData['texts'][index];  
    const currentData = {
      "id": currentBinding['id'],
      "category_id": currentBinding['category_id'],
      "audio_name": currentAudio['name'],
      "transcript": currentText['transcript']
    }
    data.push(currentData);
    // console.log(currentBinding, currentAudio, currentText);
  }
  return data;
}


export default function App() {
  const [lines , setLines] = useState(Array());

  useEffect(() => {
    fetchLines().then(async el => setLines(el));
  },[]);
  
  if (!lines) {
    return <p> Loading... </p>;
  }
  
  const transcriptLines = lines.map((line, index) => <div>
    <span key={`name_${line['audio_name']}`}> {line['audio_name']}</span>
    <audio key={`audio_${line['audio_name']}`}  controls autoPlay>
      <source key={`source_${line['audio_name']}`} src={require(`./../source/${line['audio_name']}`)} ></source>
    </audio>
    <Transcript key={`transcript_${line['audio_name']}`} transcript={line['transcript']}></Transcript>
    <Category key={`category_${line['audio_name']}`} currentCategory={line['category_id']}></Category>
    </div>
    )
  return (
    <QueryClientProvider client={queryClient}>
      {transcriptLines}
    </QueryClientProvider>
  )
}

function Transcript(props: any) {
  const [text, setText] = useState("");
  const handleChange = (ev: any) => {
    setText(ev.target.value);
  }
  
  return (
    <textarea key={`transcript_${text}`} title="Transkrpcja" value={text} onChange={handleChange}>

    </textarea>)
}

function Category(props: any) {

  const { isLoading, error, data } = useQuery('repoData', async () => {
    const res = await fetch(`${API_ADDRESS}/categories`);
    return await res.json();
  })
  const [category, setCategory] = useState("");
  if (isLoading) return (<select disabled={true}> <option> Ładowanie...</option></select>);
  if (error) return (<select disabled={true} ><option> Błąd: {error}</option></select>)

  const onCategoryChange = (ev: any) => {
    setCategory(ev.target.value);
  }

  const categories = data.map(
    (category: any) => {
      return <option key={`category_${category['id']}`} value={category['name']}> {category['name'].trim()} </option>
    })
  return (
    <select title="Kategorie głosów" value={category} onChange={onCategoryChange}>
      {categories}
    </select>)
}