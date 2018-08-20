'use strict';

// GLOBAL VARIABLES
const displaySection = document.querySelector('.display-section');
const displayQuote = document.querySelector('.display-quote');
const displayAuthor = document.querySelector('.display-author');
const quoteButtons = document.querySelector('.quote-buttons');
const tweetLink = document.querySelector('#tweet-link');
const wikiLink = document.querySelector('#wiki-link');
const newFavBtn = document.querySelector('#new-fav');
const clearFavBtn = document.querySelector('#clear-all-fav');
const favSection = document.querySelector('.favorites-section');


// FUNCTION - create element, assign className. Assign val. to attr. if present 
const makeEl = (element, classNm, attribute=null, value=null) => {
  const newEl = document.createElement(element);
  newEl.className = classNm;
  if (attribute && value) newEl[attribute] = value;

  return newEl;
};

// FUNCTION - remove child elements (used by 'printFavorites' func.)
const removeKids = (element) => {
  if (element.hasChildNodes()) {
    element.removeChild(element.firstChild);

    return removeKids(element);
  }
};


// REQUEST & QUOTE FUNCTIONS
// FUNCTION - request quote by quoteType => response to 'formatResponse' 
const getQuote = (quoteType) => {
  // diff. req. type (XHR, jsonP, fetch) for each quoteType - for practice
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
      const scriptElement = makeEl('script', 'json-p', 'src',
        'https://api.forismatic.com/api/1.0/?method=getQuote&format=jsonp&lang=en&jsonp=formatResponse'
      );
      document.body.appendChild(scriptElement);
      // remove appended script immediately
      if (document.querySelector('.json-p')) return document.body.lastChild.remove();
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

  return (printQuote(quote), setLinks(quote));
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
  // if author = 'unknown' or 'anonymous' hide wiki link (btn)
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
  let updatedQuotes;
  if (!localStorage.getItem('quotes')) {
    updatedQuotes = [newQuote];
  } else {
    const currentQuotes = JSON.parse(localStorage.getItem('quotes'));
    if (currentQuotes.some((quote) => quote.author === newQuote.author 
      && quote.quote === newQuote.quote)) {
        return showAlert('error', 'This quote is already in your favorites');
    }
    if (currentQuotes.length >= 6) {
      return showAlert('error', '6 quotes already stored. Remove one first, to make space');
    }
    updatedQuotes = [...currentQuotes, newQuote];
  }
  localStorage.setItem('quotes', JSON.stringify(updatedQuotes));
  showAlert('success', 'Quote added to your favorites!');
  
  return printFavorites();
};

// FUNCTION - remove single quote from local storage & reprint list
const removeFavorite = (element) => {
  const favDiv = element.parentElement.parentElement;
  const favIndex = parseInt(favDiv.className.split(' ').slice(1));
  const quotes = JSON.parse(localStorage.getItem('quotes'));
  const updatedQuotes = quotes.filter((quote, index) => index !== favIndex);
  if (!updatedQuotes.length) return clearFavorites();
  localStorage.setItem('quotes', JSON.stringify(updatedQuotes));
  showAlert('success', 'Quote removed from favorites!');

  return printFavorites();
};

// FUNCTION - clears all quotes in localStorage
const clearFavorites = () => {
  localStorage.removeItem('quotes');
  showAlert('success', 'All quotes removed from favorites!');

  return printFavorites();
};

// FUNCTION - print favorite quotes, stored in localStorage, to DOM 
const printFavorites = () => {
  // 1st remove all favorites from DOM before printing, to ensure no duplicates
  removeKids(favSection);
  if (!localStorage.length) return clearFavBtn.hidden = true;
  const quotes = JSON.parse(localStorage.getItem('quotes'));
  const fragment = document.createDocumentFragment();

  const prepFavEls = (quote, index) => {
    const favDiv = makeEl('div', `fav ${index}`);
    const favText = makeEl(
      'p', 'fav-text', 'textContent', `"${quote.quote}" - ${quote.author}`
    );
    const favRemove = makeEl('span', 'fav-remove', 'textContent', ' X ');
    favText.appendChild(favRemove);
    favDiv.appendChild(favText);

    return favDiv;
  };

  const favEls = quotes.map(prepFavEls);
  favEls.map((favEl) => fragment.appendChild(favEl));
  clearFavBtn.removeAttribute('hidden');

  return favSection.appendChild(fragment);
};


// USER ALERT FUNCTION
// FUNCTION - create & display <div> with alert message to DOM 
const showAlert = (alertType, msg='Oh fudge! Something went wrong') => {
  if (!document.querySelector('.alert')) {
    // if no alert - create one, append to DOM & remove after 2.5s
    const alertDiv = makeEl('div', `alert ${alertType}`);
    alertDiv.appendChild(document.createTextNode(msg));
    displaySection.insertBefore(alertDiv, displayQuote);
    setTimeout(() => {
      document.querySelector('.alert').remove();
    }, 2500);
  }
};


// FUNCTION - initialize program. Get 'random' quote onload & set eventListeners
const init = (() => {
  getQuote('random');
  if (localStorage.length) printFavorites();
  // event listeners
  quoteButtons.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') getQuote(e.target.id);
  });  
  newFavBtn.addEventListener('click', addFavorite);
  clearFavBtn.addEventListener('click', clearFavorites);
  favSection.addEventListener('click', (e) => {
    if (e.target.className === 'fav-remove') removeFavorite(e.target);
  });
})();
