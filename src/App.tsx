import algoliasearch from 'algoliasearch/lite';
import { Hit as AlgoliaHit } from 'instantsearch.js/es/types';
import TypesenseInstantSearchAdapter from "typesense-instantsearch-adapter";

import { Highlight, Hits, InstantSearch, Pagination, RefinementList } from 'react-instantsearch-hooks-web';

import './App.css';
import { Autocomplete } from './Autocomplete';
import { INSTANT_SEARCH_INDEX_NAME } from './constants';

const searchClient = algoliasearch(
  'latency',
  '6be0576ff61c053d5f9a3225e2a90f76',
);

const typesenseInstantSearchAdapter = new TypesenseInstantSearchAdapter({
  server: {
    apiKey: "8hLCPSQTYcBuK29zY5q6Xhin7ONxHy99",
    nodes: [
      {
        host: "qtg5aekc2iosjh93p-1.a1.typesense.net",
        port: 443,
        protocol: "https",
      },
    ],
  },
  additionalSearchParameters: {
    query_by: "name,description,brand",
    facet_by: "category",
  },
});


type HitProps = {
  hit: AlgoliaHit<{
    name: string;
    image: string;
    brand: string;
    categories: string[];
  }>;
};

function Hit({ hit }: HitProps) {
  return (
    <article className='hit'>
      <div className='hit-image'>
        <img src={hit.image} alt={hit.name} />
      </div>
      <div>
        <h1>
          <Highlight hit={hit} attribute='name' />
        </h1>
        <div>
          By <strong>{hit.brand}</strong> in{' '}
          <strong>{hit.categories[0]}</strong>
        </div>
      </div>
    </article>
  );
}

export function App() {
  return (
    <div>
      <InstantSearch
        searchClient={typesenseInstantSearchAdapter.searchClient}
        indexName={INSTANT_SEARCH_INDEX_NAME}
        routing
      >
        <header className='header'>
          <div className='header-wrapper wrapper'>
            <nav className='header-nav'>
              <a href='/'>Home</a>
            </nav>
            <Autocomplete
              searchClient={typesenseInstantSearchAdapter.searchClient}
              placeholder='Search products'
              detachedMediaQuery='none'
              openOnFocus={true} />
          </div>
        </header>
        <div className='container wrapper'>
          <div>
            <RefinementList attribute='brand' />
          </div>
          <div>
            <Hits hitComponent={Hit} />
            <Pagination />
          </div>
        </div>
      </InstantSearch>
    </div>
  );
}
