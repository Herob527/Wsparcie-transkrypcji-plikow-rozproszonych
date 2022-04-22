import { SetStateAction, useEffect, useState, useRef } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import './styles/css/App.css';

const queryClient = new QueryClient();

const API_ADDRESS = "http://localhost:5002";

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
			id: currentBinding["id"],
			category_id: currentBinding["category_id"],
			audio_name: currentAudio["name"],
			transcript: currentText["transcript"],
		};
		data.push(currentData);
	}
	return data;
};

export default function App() {
	const [lines, setLines] = useState(Array());
	const [page, setPage] = useState(0);
	const totalData = useRef(0);
	const elementsPerPage = 30;
	useEffect(() => {
		fetchLines(elementsPerPage * page, elementsPerPage)
			.then(async (el) => setLines(el));
		(async () => {
			const res = await fetch(`${API_ADDRESS}/get_size`)
				.then(async (el) => await el.json());
			totalData.current = res['count_1'];
		})()
	}, [page, elementsPerPage]);

	if (totalData.current === 0) {
		return (<p> Loading </p>);
	}
	const amountOfPages = Math.ceil(totalData.current / elementsPerPage);
	const paginationLines = [];
	const handlePaginationClick = (ev: any) => {
		const newPage: number = ev.target.getAttribute('data-page');
		setPage(newPage);
	}
	for (let i = 0; i < amountOfPages; i++) {
		const paginationElement =
			<span
				className='paginationElement'
				onClick={handlePaginationClick} data-page={i}
			>
				<span>
				{i + 1}
				</span>
			</span>
		paginationLines.push(paginationElement);
	}
	const transcriptLines = lines.map((line, index) => (
		<div data-id={line["id"]}>
			<span key={`name_${line["audio_name"]}`}>{line["audio_name"]}</span>
			<audio key={`audio_${line["audio_name"]}`} controls>
				<source
					key={`source_${line["audio_name"]}`}
					src={require(`./../source/${line["audio_name"]}`)}
				/>
			</audio>
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

	return (
		<QueryClientProvider key="query_provider" client={queryClient}>
			<div id='transcript' key='transcript'>
				<div id='lines'>
					{transcriptLines}
				</div>
				<div id='pagination'>
					{paginationLines}
				</div>
			</div>
			<div id='sidebar'>
				<div id='category' key='category'>
					<CategoryAddForm key='new_category_submit' />
				</div>
			</div>
		</QueryClientProvider>
	);
}

function Transcript(props: any) {
	const [text, setText] = useState(props["transcript"]);

	const handleChange = async (ev: any) => {
		setText(ev.target.value);
		const bindingId = ev.currentTarget.parentElement.getAttribute('data-id');
		const res =
			await fetch(`${API_ADDRESS}/texts`, {
				"method": "PATCH",
				"headers": {
					"Content-Type": "application/json"
				},
				"body": JSON.stringify({
					"text": text,
					"bindings_id": bindingId
				})
			})
				.then(res => res.json())
				.catch(err => err);
		console.log('Transkrypt: ', res);
	};
	return (
		<textarea
			title="Transkrpcja"
			value={text}
			onChange={handleChange}
			onBlur={handleChange}
			tabIndex={props['index'] + 1}
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
		const bindingId = ev.currentTarget.parentElement.getAttribute('data-id');
		const res =
			await fetch(`${API_ADDRESS}/categories`, {
				"method": "PATCH",
				"headers": {
					"Content-Type": "application/json"
				},
				"body": JSON.stringify({
					"category_id": Number(ev.target.value),
					"bindings_id": bindingId
				})
			})
				.then(res => res.json())
				.catch(err => console.error(err));
		console.log('Dane: ', res);
	};
	const handleClick = () => refetch();

	const categories = data.map((category: any, index: number) => {
		return (
			<option
				key={`option_${category["id"]}_${index}`}
				value={category["id"]}>
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
		>
			{categories}
		</select>
	);
}
function CategoryAddForm() {
	const [categoryName, setCategoryName] = useState("");
	const handleChange = (ev: any) => {
		setCategoryName(ev.target.value);
	}

	const handleSubmit = async (ev: any) => {
		ev.preventDefault();
		const dataFromForm = new FormData(ev.target);
		const res =
			await fetch(`${API_ADDRESS}/categories`, {
				"method": "POST",
				"headers": {
					"Content-Type": "application/json"
				},
				"body": JSON.stringify(Object.fromEntries(dataFromForm.entries()))
			})
				.then(res => res.json())
				.catch(err => err);
		console.log('Nowa kategoria: ', res);
		setCategoryName("");
	};
	return (
		<form onSubmit={handleSubmit} method="post">
			<input type="text" value={categoryName} onChange={handleChange} name="category_name" autoComplete="off" required />
			<input type="submit" name='submit_name' value='Prześlij' />
		</form>
	)
}
