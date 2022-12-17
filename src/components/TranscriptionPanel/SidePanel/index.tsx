import React from 'react';
import { useEffect } from 'react';
import { useQuery } from 'react-query';
import { useSharedFilterCategory } from '../../../hooks/useFilterByCategory';
import { useSharedOffsetState } from '../index';
import './style.sass';

const API_ADDRESS = 'http://localhost:5002';

export const SidePanel = () => (
  <section
    id='side_panel'
    className='card__container'
  >
    <AddCategory />
    <FilterByCategory />
  </section>
);

function AddCategory() {
  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
  };
  return (
    <article
      id='add_category'
      className='card'
    >
      <h1 className='card__title'> Dodaj nową kategorię </h1>
      <form
        onSubmit={handleSubmit}
        className='side_form card__container'
      >
        <input
          name='category_name'
          className='card__input'
          id='new_category_name'
        />
        <input
          type='submit'
          className='card__input card__input__button'
          value='Dodaj'
        />
      </form>
    </article>
  );
}

function FilterByCategory() {
  const { filterCategory, setFilterCategory } = useSharedFilterCategory();
  const { setOffset } = useSharedOffsetState();
  const { isLoading, error, data, refetch, remove } = useQuery(
    'get_category',
    async () => {
      const res = await fetch(`${API_ADDRESS}/categories`);
      return await res.json();
    }
  );
  useEffect(
    () => () => {
      remove();
    },
    [remove]
  );
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
    <option
      key={`option_${category['id']}_${index}`}
      value={category['id']}
    >
      {category['name'].trim()}
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
    refetch();

    return;
  };
  return (
    <article className='fitler_by_category card'>
      <h1 className='card__title'> Filtruj po kategorii </h1>
      <select
        title='Kategorie głosów'
        onChange={handleChange}
        onClick={handleClick}
        value={filterCategory}
        className='category card__input'
      >
        <option
          value={-1}
          key={'option_all'}
        >
          Wszystkie
        </option>
        {categories}
      </select>
    </article>
  );
}
