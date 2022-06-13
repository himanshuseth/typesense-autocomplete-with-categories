import { createElement, Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { render } from 'react-dom';

import { usePagination, useSearchBox } from 'react-instantsearch-hooks';
import { autocomplete, AutocompleteOptions } from '@algolia/autocomplete-js';
import { BaseItem } from '@algolia/autocomplete-core';

import '@algolia/autocomplete-theme-classic';
import {
  INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTES,
  INSTANT_SEARCH_INDEX_NAME,
  INSTANT_SEARCH_QUERY_SUGGESTIONS,
} from './constants';

import { createLocalStorageRecentSearchesPlugin } from '@algolia/autocomplete-plugin-recent-searches';
import { SearchClient } from 'algoliasearch/lite';
import { createQuerySuggestionsPlugin } from '@algolia/autocomplete-plugin-query-suggestions';
import { useHierarchicalMenu } from 'react-instantsearch-hooks-web';

type AutocompleteProps = Partial<AutocompleteOptions<BaseItem>> & {
  searchClient: SearchClient;
  className?: string;
};

type SetInstantSearchUiStateOptions = {
  query: string;
  category?: string;
};

export function Autocomplete({
                               searchClient,
                               className,
                               ...autocompleteProps
                             }: AutocompleteProps) {

  const autocompleteContainer = useRef<HTMLDivElement>(null);
  const { items: categories, refine: setCategory } = useHierarchicalMenu({
    attributes: INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTES,
  });

  const { query, refine: setQuery } = useSearchBox();
  const { refine: setPage } = usePagination();

  const [instantSearchUiState, setInstantSearchUiState] = useState<SetInstantSearchUiStateOptions>({ query });

  const currentCategory = useMemo(() => {
    const category = categories.find(({ isRefined }) => isRefined);
    return category && category.value;
  }, [categories]);

  const plugins = useMemo(() => {
    const recentSearches = createLocalStorageRecentSearchesPlugin({
      key: 'instantsearch',
      limit: 3,
      transformSource({ source }) {
        console.log('In autoComplete', source);
        return {
          ...source,
          onSelect({ item }) {
            setInstantSearchUiState({ query: item.label });
          },
        };
      },
    });

    const querySuggestions = createQuerySuggestionsPlugin({
      searchClient,
      indexName: INSTANT_SEARCH_QUERY_SUGGESTIONS,
      getSearchParams() {
        return recentSearches.data!.getAlgoliaSearchParams({
          hitsPerPage: 6
        });
      },
      categoryAttribute: [
        INSTANT_SEARCH_INDEX_NAME,
        "facets",
        "exact_matches",
        INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTES[0]
      ],
      transformSource({ source }) {
        return {
          ...source,
          sourceId: "querySuggestionsPlugin",
          onSelect({ item }) {
            setInstantSearchUiState({
              query: item.query,
              category: item.__autocomplete_qsCategory || ""
            });
          },
          getItems(params) {
            if (!params.state.query) {
              return [];
            }

            return source.getItems(params);
          },
        };
      }
    });

    return [recentSearches, querySuggestions];
  }, []);

  useEffect(() => {
    setQuery(instantSearchUiState.query);
    instantSearchUiState.category && setCategory(instantSearchUiState.category);
    setPage(0);
  }, [instantSearchUiState]);

  useEffect(() => {
    console.log('UseEffect called for plugins', plugins);
    console.log('autocompleteContainer.current', autocompleteContainer.current);
    if (!autocompleteContainer.current) {
      return;
    }

    const autocompleteInstance = autocomplete({
      ...autocompleteProps,
      container: autocompleteContainer.current,
      initialState: { query },
      onReset() {
        setInstantSearchUiState({ query: "", category: currentCategory });
      },
      onSubmit({ state }) {
        setInstantSearchUiState({ query: state.query });
      },
      onStateChange({ prevState, state }) {
        if (prevState.query !== state.query) {
          setInstantSearchUiState({
            query: state.query,
          });
        }
      },
      renderer: { createElement, Fragment, render },
      plugins,
    });

    return () => autocompleteInstance.destroy();
  }, [plugins]);

  return <div className={className} ref={autocompleteContainer} />;
}
