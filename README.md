# redux-in-place

> A react/redux library to manage and organize redux's store attributes.

## Motivation

Every application tends to grow and one of many difficulties is to keep your code clean and organized;
so it happens with Redux's store, as the store grows many attributes appears and it become hard to track to
which domain or page they belong. Redux-in-place proposes to organize the store's attribute tree in a simple
and understandable way. 

## How it works

Let's suppose that in the store we have an user that is authenticated who wants
to buy some books. Store's properties would look like something like this.
```javascript
{ 
  username: 'Foo',
  registrationDate: '2016-12-10',
  bookName: 'Last wish',
  author: 'Andrzej Sapkowski'
}
```
When those attributes grow will become harder and harder to assert to which
domain those properties come from. With redux-in-place we could do:

```javascript
{ 
  User: {
    username: 'Foo',
    registrationDate: '2016-12-10'
  },
  Book: {
    name: 'Last wish',
    author: 'Andrzej Sapkowski' 
  }
}
```
It becomes easier to read and to organize store's properties.

## How to use

First of all

```javascript
npm install redux-in-place
```

Then you user your redux like you normally would but instead of exporting it, you should connect
your reduce with redux-in-place like this:

```javascript
import { placeReducer } from 'redux-in-place';

export const UPDATE_INFORMATION = 'UPDATE_INFORMATION';

const initialState = {
  name: '',
  author: '',
};

const reducer = (state = initialState, action) => ({
  [UPDATE_INFORMATION]: {
    ...state,
    name: action.name,
    author: action.author,
  }
}[action.type] || state);

export default placeReducer('Book', reducer);
```

Then in your React component:

```javascript
import { connectReducer } from 'redux-in-place';
import bookReducer from 'bookReducer';
//...code ommited for sake of simplicity
const ConnectedBook = connect(
  ({ Book }) => ({
    author: Book.author,
    name: Book.name
  })
)(BookComponent);

export default connectReducer(bookReducer)(ConnectedBook);
```
That's it, simple like that, now all your reducer properties will be on 'Book'.

## License
Copyright (c) 2016 Gabriel Reitz Giannattasio
Licensed under the [MIT license](LICENSE-MIT).

