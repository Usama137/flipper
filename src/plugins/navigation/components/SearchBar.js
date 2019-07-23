/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 * @flow strict-local
 */

import {
  Component,
  styled,
  SearchBox,
  SearchInput,
  Toolbar,
  Glyph,
} from 'flipper';
import {IconButton, FavoriteButton} from './';

type Props = {|
  onFavorite: (query: string) => void,
  onNavigate: (query: string) => void,
|};

type State = {|
  query: string,
|};

const IconContainer = styled('div')({
  display: 'inline-flex',
  height: '16px',
  alignItems: 'center',
  '': {
    marginLeft: 10,
    '.icon-button': {
      height: 16,
    },
    'img,div': {
      verticalAlign: 'top',
      alignItems: 'none',
    },
  },
});

const SearchChevronContainer = styled('div')({
  marginRight: 12,
});

class SearchBar extends Component<Props, State> {
  state = {
    query: '',
  };

  favorite = (query: string) => {
    this.props.onFavorite(query);
  };

  navigateTo = (query: string) => {
    this.props.onNavigate(query);
  };

  queryInputChanged = (event: SyntheticInputEvent<>) => {
    this.setState({query: event.target.value});
  };

  render = () => {
    return (
      <Toolbar>
        <SearchBox>
          <SearchInput
            onChange={this.queryInputChanged}
            onKeyPress={e => {
              if (e.key === 'Enter') {
                this.navigateTo(this.state.query);
              }
            }}
            placeholder="Navigate To..."
          />
          <SearchChevronContainer>
            <Glyph name="chevron-down" size={12} />
          </SearchChevronContainer>
        </SearchBox>
        <IconContainer>
          <IconButton
            icon="send"
            size={16}
            outline={true}
            onClick={() => this.navigateTo(this.state.query)}
          />
          <FavoriteButton
            size={16}
            highlighted={false}
            onClick={() => this.favorite(this.state.query)}
          />
        </IconContainer>
      </Toolbar>
    );
  };
}

export default SearchBar;