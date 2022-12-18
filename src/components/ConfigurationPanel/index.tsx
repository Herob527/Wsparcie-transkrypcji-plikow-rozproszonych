import './ConfigurationPanel.sass';
import { E_API_ADDRESS } from '../../App';
import React, { MouseEvent, useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';

const ConfigQueryClient = new QueryClient();

export function ConfigurationPanel(props: any) {
  document.title = 'Konfiguracja';
  return (
    <QueryClientProvider
      client={ConfigQueryClient}
      key='query_config_panel'
    >
      <div id='ConfigurationPanel'>
        <CategoriesManager></CategoriesManager>
        <div
          id='side-container'
          className='card__container'
        >
          <Reset />
          <ElementsPerPage />
          <ThemeList />
          <ShortcutList />
        </div>
      </div>
    </QueryClientProvider>
  );
}

function ElementsPerPage(props: any) {
  return (
    <form
      id='elementPerPage'
      className='card'
    >
      <p className='card__title'> Ilość elementów na stronę </p>
      <input
        type='number'
        className='card__input'
      />
    </form>
  );
}

function CategoriesManager(props: any) {
  const { isLoading, error, data } = useQuery(
    'categories_query',
    async () => {
      const res = await fetch(`${E_API_ADDRESS}/categories`);
      return await res.json();
    },
    { 'refetchOnWindowFocus': false }
  );

  if (error) {
    console.error(error);
    return <p> Error... </p>;
  }
  if (isLoading) {
    return <p> Loading... </p>;
  }
  function CategoryLine(cProps: any) {
    const [text, setText] = useState(cProps['categoryName']);

    const handleDelete = async (event: MouseEvent<HTMLButtonElement>) => {
      const IdToDelete = Number(
        event.currentTarget.parentElement?.getAttribute('data-category-id')
      );
      await fetch(`${E_API_ADDRESS}/categories`, {
        'headers': {
          'Content-Type': 'application/json',
          'Charset': 'utf8',
        },
        'method': 'DELETE',
        'body': JSON.stringify(IdToDelete),
      })
        .then((_) =>
          document
            .querySelector(`.category_line[data-category-id='${IdToDelete}']`)
            ?.remove()
        )
        .catch((err) => console.error(err));
    };
    const handleUpdate = async (event: MouseEvent<HTMLButtonElement>) => {
      const clickedElement = event.currentTarget;
      const idToUpdate = Number(
        event.currentTarget.parentElement?.getAttribute('data-category-id')
      );
      const newValue = event.currentTarget.getAttribute('data-value');
      const res = await fetch(`${E_API_ADDRESS}/categories`, {
        'headers': {
          'Content-Type': 'application/json',
          'Charset': 'utf8',
        },
        'method': 'PATCH',
        'body': JSON.stringify({
          'category_id': idToUpdate,
          'new_value': newValue,
        }),
      })
        .then((response) => response.json())
        .then((resData) => resData)
        .catch((err) => err);
      console.log(res);
      const result = res['Success'] ? 'success' : 'error';

      clickedElement.classList.add(result);
      setTimeout(() => clickedElement.classList.remove(result), 2000);
    };
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setText(event.target.value);
    };

    return (
      <div
        data-category-id={cProps['categoryId']}
        className='card__row'
      >
        <input
          key={`input${cProps['tabIndex']}${1}${cProps['categoryId']}`}
          tabIndex={cProps['tabIndex'] + 1}
          type='text'
          className='category_name card__input'
          value={text}
          title={text}
          onChange={handleInputChange}
        ></input>
        <button
          className='remove_category card__input card__input__button'
          title='Zmiłuj się'
          onClick={handleDelete}
        >
          Usuń
        </button>
        <button
          className='confirm_new_name card__input card__input__button'
          onClick={handleUpdate}
          title='Zatwierdź nową nazwę'
          data-value={text}
        >
          Zatwierdź
        </button>
      </div>
    );
  }
  return (
    <div id='category_manager'>
      <p className='card__title'> Zarządzanie kategoriami</p>
      <div
        id='categories_container'
        className='card__container'
      >
        {data.map((el: any, index: number) => (
          <CategoryLine
            tabIndex={index}
            categoryName={el['name']}
            categoryId={el['id']}
            key={el['id'] + index + el['name']}
          ></CategoryLine>
        ))}
      </div>
      <button
        className='card__input card__input__button'
        id='btn_confirm_all'
      >
        Zatwierdź wszystkie
      </button>
    </div>
  );
}

function Reset(props: any) {
  return (
    <form
      id='reset'
      className='card'
    >
      <p className='card__title'> Reset projektu </p>
      <label
        htmlFor='newDatabase'
        className='card__label'
      >
        Nazwa nowej bazy danych
      </label>
      <input
        type='text'
        name='newDatabase'
        className='card__input'
        id='newDatabase'
      />
      <button
        title='Stworzy nową bazę danych'
        className='card__input card__input__button '
      >
        Reset
      </button>
    </form>
  );
}
function DatabaseList(props: any) {
  return (
    <form
      id='database_list'
      className='card'
    >
      <p className='component_title'> Wybór bazy danych znanych API</p>
      <select
        name='databases'
        id='databases'
      >
        {/* List of available databases */}
      </select>
    </form>
  );
}

function ThemeList(props: any) {
  return (
    <form
      id='theme_list'
      className='card'
    >
      <p className='card__title'> Wybór styli przestrzeni roboczej</p>
      <select
        name='themes'
        id='themes'
        className='card__input'
      >
        {/* List of available styles */}
      </select>
    </form>
  );
}

function ShortcutList(props: any) {
  return (
    <div
      id='shortcutManager'
      className='card'
    >
      <p className='card__title'> Skróty klawiszowe </p>
    </div>
  );
}
