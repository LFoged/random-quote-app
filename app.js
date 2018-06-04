'use strict';

// GLOBAL VARIABLES
const doc = document;
const displaySection = doc.querySelector('.display-section');
const displayQuote = doc.querySelector('.display-quote');
const displayAuthor = doc.querySelector('.display-author');
const quoteButtons = doc.querySelector('.quote-buttons');
const tweetLink = doc.querySelector('#tweet-link');
const wikiLink = doc.querySelector('#wiki-link');
const newFavBtn = doc.querySelector('#new-fav');
const clearFavBtn = doc.querySelector('#clear-all-fav');
const favSection = doc.querySelector('.favorites-section');


// FUNCTION - create element, assign className. Assign value to attribute if present 
const newElement = (element, classNm, attribute=null, value=null) => {
  const newEl = doc.createElement(element);
  newEl.className = classNm;
  if (attribute && value) newEl[attribute] = value;

  return newEl;
};


// REQUEST & QUOTE FUNCTIONS
// FUNCTION - AJAX request to get quote => response to 'formatResponse' 
const getQuote = (quoteType) => {
  // diff. req. type (jsonP, XHR, fetch) for each quote type - practice
  const makeRequest = {
    random: () => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://favqs.com/api/qotd', true);
      xhr.onload = () => {
        if (xhr.status !== 200) return showAlert('error');
        const response = JSON.parse(xhr.responseText);
        
        return formatResponse(response);
      };
      xhr.onerror = (err) => showAlert('error');
      xhr.send();
    },

    inspire: () => {
      const scriptElement = newElement('script', 'json-p', 'src',
        'https://api.forismatic.com/api/1.0/?method=getQuote&format=jsonp&lang=en&jsonp=formatResponse'
      );
      doc.body.appendChild(scriptElement);
      // remove appended script immediately
      if (doc.querySelector('.json-p')) return doc.body.lastChild.remove();
    },

    program: () => {
      fetch('http://quotes.stormconsultancy.co.uk/random.json')
        .then(response => response.json())
        .then(formatResponse)
        .catch(error => showAlert('error'));
    }
  }

  return makeRequest[quoteType]();
};


// FUNCTION - format data into own obj. Pass to 'printQuote' & 'setLinks'
const formatResponse = (data) => {
  const quote = {
    quote: data.quoteText || data.quote.body || data.quote,
    author: (data.quoteAuthor === '' ? 'Unknown' : data.quoteAuthor)
      || data.quote.author 
      || data.author
  };

  return printQuote(quote), setLinks(quote);
};


// FUNCTION - print quote & author to DOM
const printQuote = (quoteObj) => {
  return (
    displayQuote.textContent = quoteObj.quote,
    displayAuthor.textContent = quoteObj.author
  );
  
};


// FUNCTION - set 'href' attr. on tweet & wiki buttons
const setLinks = (quoteObj) => {
  // if author = 'unknown' hide wiki link (btn)
  const authorCheck = quoteObj.author.toLowerCase();
  if (authorCheck === 'unknown' || authorCheck === 'anonymous') {
    wikiLink.hidden = true;
    wikiLink.href = '';
  } else {
    wikiLink.hidden = false;
    wikiLink.href = `https://en.wikipedia.org/wiki/${quoteObj.author.replace(/\s/, '_')}`;
  }
  tweetLink.href = `https://twitter.com/home/?status="${quoteObj.quote}" - ${quoteObj.author}`;
};



// LOCAL STORAGE FUNCTIONS
// FUNCTION - store quote to localStorage
const addFavorite = () => {
  const newQuote = {
    quote: displayQuote.textContent,
    author: displayAuthor.textContent
  };

  if (localStorage.length < 1) {
    const quotes = [newQuote];
    localStorage.setItem('quotes', JSON.stringify(quotes));
  } else {
    const quotes = JSON.parse(localStorage.getItem('quotes'));
    if (quotes.some((quote) => quote.author === newQuote.author 
      && quote.quote === newQuote.quote)) {
        return showAlert('error', 'This quote is already in your favorites');
    }
    if (quotes.length >= 6) {
      return showAlert('error', '6 quotes stored. Remove one first, to make space')
    }
    quotes.push(newQuote);
    localStorage.setItem('quotes', JSON.stringify(quotes));
  }
  showAlert('success', 'Quote added to your favorites!')
  
  return printFavorites();
};


// FUNCTION - remove single quote from local storage & reprint list
const removeFavorite = (element) => {
  const favDiv = element.parentElement.parentElement;
  const favIndex = parseInt(favDiv.className.split(' ').slice(1));
  const quotes = JSON.parse(localStorage.getItem('quotes'));
  const newQuotes = quotes.filter((quote, index) => index !== favIndex);
  if (!newQuotes.length) return clearFavorites();
  localStorage.setItem('quotes', JSON.stringify(newQuotes));
  showAlert('success', 'Quote removed from favorites!')

  return printFavorites();
};


// FUNCTION - clears all quotes in localStorage
const clearFavorites = () => {
  localStorage.removeItem('quotes');
  showAlert('success', 'All quotes removed from favorites!')

  return printFavorites();
};


// FUNCTION - print favorite quotes, stored in localStorage, to DOM 
const printFavorites = () => {
  // 1st remove all favorites from DOM before printing, to ensure no duplicates
  while (favSection.hasChildNodes()) favSection.removeChild(favSection.firstChild);
  if (!localStorage.length) {
    clearFavBtn.hidden = true;
  } else {
    const docFragment = doc.createDocumentFragment();
    const quotes = JSON.parse(localStorage.getItem('quotes'));
    quotes.map((quote, index) => {
      const favDiv = newElement('div', `fav ${index}`);
      const favText = newElement(
        'h4', 'fav-text', 'textContent', `"${quote.quote}" - ${quote.author}`
      );
      const favRemove = newElement('span', 'fav-remove', 'textContent', '  X  ');
      
      favText.appendChild(favRemove);
      favDiv.appendChild(favText);
      docFragment.appendChild(favDiv);
    });
    clearFavBtn.removeAttribute('hidden');

    return favSection.appendChild(docFragment);
  }
};


// USER ALERT FUNCTION
// FUNCTION - create & display <div> with alert message to DOM 
const showAlert = (alertType, msg='Oh fudge! Something went wrong') => {
  const alertDiv = newElement('div', `alert ${alertType}`);
  alertDiv.appendChild(doc.createTextNode(msg));
  // check if any 'alertDiv' in DOM already & append if none. Remove after 2.5s.
  if (!doc.querySelector('.alert')) displaySection.insertBefore(alertDiv, displayQuote);
  setTimeout(() => {
    if (doc.querySelector('.alert')) return doc.querySelector('.alert').remove();
  }, 2500);
};



// FUNCTION - initialize program. Get 'random' quote onload & set eventListeners
const init = (() => {
  getQuote('random');
  quoteButtons.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON') return getQuote(event.target.id);
  });
  // favorites (localStorage related functions) eventListeners
  if (localStorage.length) printFavorites();
  newFavBtn.addEventListener('click', addFavorite);
  clearFavBtn.addEventListener('click', clearFavorites);
  // event listener to remove individual quotes from favorite list
  favSection.addEventListener('click', (event) => {
    if (event.target.className === 'fav-remove') return removeFavorite(event.target);
  });
})();
