'use strict';


/* UTILITY FUNCTIONS */
const UTILS = (() => {
  const _doc = document;

  // create elements, assign class & attributes if any
  const createEls = (elArr = []) => {
    const els = elArr.map((elObj) => {
      const el = _doc.createElement(elObj.el);
      el.className = elObj.class;
      if (elObj.attr) el[elObj.attr.name] = elObj.attr.val;
      
      return el;
    });
  
    return els;
  };

  // remove element after x millisecond delay - used by alert
  const removeEl = (elQuerySelector, delay) => {
    return setTimeout(() => {
      _doc.querySelector(elQuerySelector).remove();
    }, delay);
  };

  // recursively remove HTML childNodes from an element
  const removeKids = (element) => {
    if (element.hasChildNodes()) {
      element.removeChild(element.firstChild);
  
      return UTILS.removeKids(element);
    }
  };

  // return specified attribute of an element
  const getElAttr = (elQuerySelector, attr) => {
    return _doc.querySelector(elQuerySelector)[attr]
      || alertCtrl('error', 'Element or Attribute Not Found');
  };

  // appends Array of elements to a document fragment
  const appendToFragment = (elArr = []) => {
    const fragment = _doc.createDocumentFragment();
    elArr.map((el) => fragment.appendChild(el));

    return fragment;
  };

  return Object.freeze({
    createEls,
    removeEl,
    removeKids,
    getElAttr,
    appendToFragment
  });
})();


/* FUNCTIONS & VARIABLES THAT DIRECTLY DEAL WITH / 'TOUCH' DOM */
const DOM = ((UTILS) => {
  const {createEls, appendToFragment, removeEl} = UTILS;
  const _doc = document;

  // DOM elements
  const els = Object.freeze({
    alertSection: _doc.querySelector('.alert-section'),
    displaySection: _doc.querySelector('.display-section'),
    favSection: _doc.querySelector('.favorites-section'),
    quoteButtons: _doc.querySelector('.quote-buttons'),
    tweetLink: _doc.querySelector('#tweet-link'),
    wikiLink: _doc.querySelector('#wiki-link'),
    newFavBtn: _doc.querySelector('#new-fav'),
    clearFavBtn: _doc.querySelector('#clear-all-fav')
  });
  
  // templates for alert, quotes, etc.
  const templates = Object.freeze({
    alert: (alertType, msg = 'Oh fudge! Something Broke') => {
      const [alertDiv, alertMsg] = createEls([
        {el: 'div', class: `alert ${alertType}`},
        {el: 'p', class: 'alert-msg', attr: {name: 'textContent', val: msg}}
      ]);
      alertDiv.appendChild(alertMsg);
  
      return alertDiv;
    },
    jsonP: (url) => {
      return createEls([{
        el: 'script',
        class: 'json-p',
        attr: {name: 'src', val: url}
      }]);
    },
    quote: (quoteObj) => {
      return createEls([
        {
          el: 'h1',
          class: 'display-quote',
          attr: {name: 'textContent', val: quoteObj.quote}
        },
        {
          el: 'h3',
          class: 'display-author',
          attr: {name: 'textContent', val: `- ${quoteObj.author}`}
        }
      ]);
    },
    favorite: (quote, index) => {
      const [favDiv, favText, favAuthor, favRemove] = createEls([
        {el: 'div', class: `fav ${index}`},
        {
          el: 'p',
          class: 'fav-text',
          attr: {name: 'textContent', val: `${quote.quote}`}
        },
        {
          el: 'span',
          class: 'fav-author',
          attr: {name: 'textContent', val: `- ${quote.author}`}
        },
        {
          el: 'button',
          class: 'btn fav-remove',
          attr: {name: 'textContent', val: 'DELETE'}
        }
      ]);
      favText.appendChild(favAuthor);
      favDiv.appendChild(favText);
      favDiv.appendChild(favRemove);

      return favDiv;
    }
  });

  // if no 'alert' <div> in DOM, create one, append it & remove after x secs
  const alertCtrl = (alertType, msg = 'Oh Fudge! Something Broke') => {
    if (!_doc.querySelector('.alert')) {
      const template = templates.alert(alertType, msg);
      const fragment = appendToFragment([template]);
      printer(els.alertSection, fragment);
      
      return removeEl('.alert', 2100);
    }
  };

  // 'prints' (appends) fragment to DOM
  const printer = (target, fragment) => target.appendChild(fragment);

  return Object.freeze({ els, templates, alertCtrl, printer });
})(UTILS);


/* FUNCTIONS FOR GETTING & PROCESSING QUOTES */
const QUOTES = ((DOM) => {
  const {els, templates, alertCtrl} = DOM;
  const {wikiLink, tweetLink} = els;

  const _fetchReq = (url, handler) => {
    return fetch(url)
      .then((res) => res.json())
      .then(handler)
      .catch((err) => alertCtrl('error', 'Request Error'));
  };

  const _jsonPReq = (url) => {
    const [jsonPScriptEl] = templates.jsonP(url);
    const docBody = document.body;
    docBody.appendChild(jsonPScriptEl);

    return docBody.lastChild.remove();
  };

  // set URL, determine type of request (fetch / JSONP) & make request
  const makeReq = (quoteType, handler) => {
    const apiUrls = {
      random: 'https://favqs.com/api/qotd',
      inspire: `https://api.forismatic.com/api/1.0/?method=getQuote&format=jsonp&lang=en&jsonp=INIT.quoteResponseCtrl`,
      simpsons: 'https://thesimpsonsquoteapi.glitch.me/quotes',
    };
    const url = apiUrls[quoteType];
    const useJsonP = ['inspire'];

    // make request => response handled by 'INIT.quoteResponseCtrl'
    return (useJsonP.includes(quoteType)) 
      ? _jsonPReq(url)
      : _fetchReq(url, handler); 
  };

  // format raw response data (quote)
  const formatQuote = (quote) => {
    // format 'simpsons' quotes responses
    if (quote[0]) {
      return {quote: quote[0].quote, author: quote[0].character};
    } 

    // format responses from all other quote types
    return {
      quote: quote.quoteText || quote.quote.body,
      author: ((quote.quoteAuthor === '') ? 'Unknown' : quote.quoteAuthor)
        || quote.quote.author
    };
  };

  // manage wiki & tweet link buttons according to response quote
  const setWikiTweetLinks = (quoteObj) => {
    const author = quoteObj.author.toLowerCase();
    if (author === 'unknown' || author === 'anonymous') {
      wikiLink.style.display = 'none';
      wikiLink.href = '';
    } else {
      wikiLink.style.display = 'inline-block';
      wikiLink.href = `https://en.wikipedia.org/wiki/${
        quoteObj.author.replace(/\s/, '_')
      }`;
    }
    
    return tweetLink.href = `https://twitter.com/home/?status="${
      quoteObj.quote}" - ${quoteObj.author
      }`;
  };

  return Object.freeze({ makeReq, formatQuote, setWikiTweetLinks });
})(DOM);


/* FUNCTIONS FOR MANAGING DATA SAVED TO LOCAL STORAGE */
const FAVORITES = ((UTILS, DOM) => {
  const {els, templates, alertCtrl, printer} = DOM;
  const {favSection, clearFavBtn} = els;
  const {getElAttr, removeKids, appendToFragment} = UTILS
  const store = localStorage;

  // retrieve quotes from local storage
  const getQuotes = () => JSON.parse(store.getItem('quotes'));
  const saveQuotes = (quotes) => {
    return store.setItem('quotes', JSON.stringify(quotes));
  };
  
  const printAll = () => {
    removeKids(favSection);
    if (!store.length) return clearFavBtn.hidden = true;
    const quotes = getQuotes();
    const templatesArr = quotes.map(templates.favorite);
    const fragment = appendToFragment(templatesArr);
    clearFavBtn.removeAttribute('hidden');
  
    return printer(favSection, fragment);
  };

  const addOne = () => {
    const maxQuotes = 15;
    const currentQuotes = getQuotes();
    const newQuote = {
      quote: getElAttr('.display-quote', 'textContent'),
      author: getElAttr('.display-author', 'textContent').slice(2),
    };
    let updatedQuotes;
    
    if (!currentQuotes) {
      updatedQuotes = [newQuote];
    } else {
      if (currentQuotes.some((quote) => (quote.author === newQuote.author) 
        && (quote.quote === newQuote.quote))) {
          return alertCtrl('error', 'This quote is already in your favorites');
      }
      if (currentQuotes.length >= maxQuotes) {
        return alertCtrl('error', 'Remove a quote to make space for a new one');
      }
      updatedQuotes = [...currentQuotes, newQuote];
    }
    saveQuotes(updatedQuotes);
    alertCtrl('success', 'Quote added to favorites!');

    return printAll();
  };

  const removeOne = (element) => {
    const favDiv = element.parentElement;
    const favIndex = parseInt(favDiv.className.split(' ').slice(1));
    const quotes = getQuotes();
    const updatedQuotes = quotes.filter((quote, index) => index !== favIndex);
    if (!updatedQuotes.length) return removeAll();
    saveQuotes(updatedQuotes);
    alertCtrl('success', 'Quote removed from favorites!');
  
    return printAll();
  };

  const removeAll = () => {
    store.removeItem('quotes');
    alertCtrl('success', 'All quotes removed from favorites!');
  
    return printAll();
  };

  return Object.freeze({printAll, addOne, removeOne, removeAll});
})(UTILS, DOM);


// initialize program
const INIT = ((UTILS, DOM, QUOTES, FAVORITES) => {
  const {removeKids, appendToFragment} = UTILS;
  const {els, alertCtrl, templates, printer} = DOM;
  const {makeReq, formatQuote, setWikiTweetLinks} = QUOTES;
  const {printAll, addOne, removeOne, removeAll} = FAVORITES;
  const {
    displaySection,
    quoteButtons,
    newFavBtn,
    clearFavBtn,
    favSection
  } = els;

  // response handler. NOTE: function is public so jsonP response can 'find' it
  const quoteResponseCtrl = (rawResponse) => {
    const formattedQuote = formatQuote(rawResponse);
    const template = templates.quote(formattedQuote);
    const fragment = appendToFragment(template);
    removeKids(displaySection);
    setWikiTweetLinks(formattedQuote)
    
    return printer(displaySection, fragment);
  };

  // event listeners
  quoteButtons.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      return makeReq(e.target.id, quoteResponseCtrl);
    }
  });
  newFavBtn.addEventListener('click', addOne);
  clearFavBtn.addEventListener('click', removeAll);
  favSection.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      return removeOne(e.target);
    }
  });

  // initiate program with 'random' quote & print any saved favorites
  makeReq('random', quoteResponseCtrl);
  if (localStorage.length) printAll();

  // print an error msg if no quote on DOM after 2.5sec
  setTimeout(() => {
    if (!document.querySelector('.display-quote')) {
      const errMsg = 'There might be a request error. Please try again'

      return alertCtrl('error', errMsg);
    }
  }, 2500);

  return Object.freeze({ quoteResponseCtrl });
})(UTILS, DOM, QUOTES, FAVORITES);
