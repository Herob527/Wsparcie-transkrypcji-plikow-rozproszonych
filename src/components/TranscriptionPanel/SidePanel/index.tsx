import { useEffect, useRef } from "react";
import { useQuery } from "react-query";
import { useFilterByCategory, useSharedFilterCategory } from '../../../hooks/useFilterByCategory'
import {useSharedOffsetState} from '../index'
import './style.sass'
// import {useSharedFilterCategory} from '../index'

const API_ADDRESS = 'http://localhost:5002';

export const SidePanel = () => {
    return (<section id='side_panel'>
        <AddCategory />
        <FilterByCategory />
    </section>)
}

function AddCategory() {
    const handleSubmit = (ev: React.FormEvent) => {
        ev.preventDefault();
    }
    return (<article id='add_category'>
        <h1>Dodaj nową kategorię </h1> 
        <form onSubmit={handleSubmit} className='side_form'>
            <label htmlFor="new_category_name" className='form__label'> Nazwa nowej kategorii</label>
            <input name='category_name'  className='form__input' id='new_category_name'/>
            <input type='submit' className='form__input form__submit'/>
        </form>
    </article>)
}

function FilterByCategory() {
    const { filterCategory, setFilterCategory } = useSharedFilterCategory();
    const {setOffset} = useSharedOffsetState();
    const { isLoading, error, data, refetch, remove } = useQuery("get_category", async () => {
        const res = await fetch(`${API_ADDRESS}/categories`);
        return await res.json();
    });
    useEffect(() => {
        console.log(filterCategory)
        return () => {
            remove();
        }
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
    const categories = data.map((category: any, index: number) => (
        <option key={`option_${category["id"]}_${index}`} value={category["id"]}>
            {category["name"].trim()}
        </option>
    ));
    const handleChange = async (ev: any) => {
        const categoryId = parseInt(ev.target.value);
        setFilterCategory(categoryId);
        setOffset(0);
        console.log(categoryId);
        return;
    };
    const handleClick = (ev: React.PointerEvent<HTMLSelectElement>) => {
        refetch()

        return;
    };
    return (<article className='fitler_by_category'>
        <h1> Filtruj po kategorii </h1>
        <select
            title="Kategorie głosów"
            onChange={handleChange}
            onClick={handleClick}
            value={filterCategory}
            className="category form__input"
        >
            <option value={-1} key={'option_all'}>
                Wszystkie
            </option>
            {categories}
        </select>
    </article>)
}