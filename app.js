'use strict';

/* FUNCTIONS & VARIABLES USED THROUGHOUT APP */
const GLOBAL = (() => {
  const doc = document;
  const els = Object.freeze({
    alertSection: doc.querySelector('.alert-section'),
    displaySection: doc.querySelector('.display-section'),
    favSection: doc.querySelector('.favorites-section'),
    quoteButtons: doc.querySelector('.quote-buttons'),
    tweetLink: doc.querySelector('#tweet-link'),
    wikiLink: doc.querySelector('#wiki-link'),
    newFavBtn: doc.querySelector('#new-fav'),
    clearFavBtn: doc.querySelector('#clear-all-fav')
  });

  const createEls = (elArr = []) => {
    const els = elArr.map((elObj) => {
      const el = doc.createElement(elObj.el);
      el.className = elObj.class;
      if (elObj.attr) el[elObj.attr.name] = elObj.attr.val;
      
      return el;
    });
  
    return els;
  };

  const removeEl = (elQuerySelector, delay) => {
    return setTimeout(() => {
      doc.querySelector(elQuerySelector).remove();
    }, delay);
  };

  const getElAttr = (elQuerySelector, attr) => {
    return doc.querySelector(elQuerySelector)[attr]
      || alertCtrl('error', 'Element or Attribute Not Found');
  };

  // recursively remove HTML childNodes from element
  const removeKids = (element) => {
    if (element.hasChildNodes()) {
      element.removeChild(element.firstChild);
  
      return removeKids(element);
    }
  };
  
  // returns function for creating specified template 
  const makeTemplate = (templateName) => {
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
        const [favDiv, favText, favRemove] = createEls([
          {el: 'div', class: `fav ${index}`},
          {
            el: 'p',
            class: 'fav-text',
            attr: {name: 'textContent', val: `"${quote.quote}" ${quote.author}`}
          },
          {
            el: 'span',
            class: 'btn fav-remove',
            attr: {name: 'textContent', val: 'DELETE'}
          }
        ]);
        favText.appendChild(favRemove);
        favDiv.appendChild(favText);
    
        return favDiv;
      }
    });

    return templates[templateName];
  };

  // if no 'alert' <div> in DOM, create one, append it & remove after x secs
  const alertCtrl = (alertType, msg = 'Oh Fudge! Something Broke') => {
    if (!doc.querySelector('.alert')) {
      const template = makeTemplate('alert')(alertType, msg);
      const fragment = appendToFragment([template]);
      printer(els.alertSection, fragment);
      
      return removeEl('.alert', 2300);
    }
  };

  const appendToFragment = (elArr = []) => {
    const fragment = doc.createDocumentFragment();
    elArr.map((el) => fragment.appendChild(el));

    return fragment;
  };

  const printer = (target, fragment) => target.appendChild(fragment);

  return Object.freeze({
    els,
    getElAttr,
    removeKids,
    makeTemplate,
    appendToFragment,
    alertCtrl,
    printer
  });
})();


/* FUNCTIONS FOR GETTING & PROCESSING QUOTES */
const quoteModule = ((GLOBAL) => {
  const {displaySection, wikiLink, tweetLink} = GLOBAL.els;
  const {
    alertCtrl,
    makeTemplate,
    appendToFragment,
    removeKids,
    printer
  } = GLOBAL;

  // set URL for request, determine type of request to make and send request
  const prepReq = (quoteType) => {
    const apiUrls = {
      qotd: 'https://favqs.com/api/qotd',
      inspire: `https://api.forismatic.com/api/1.0/?method=getQuote&format=jsonp&lang=en&jsonp=quoteModule.quoteCtrl`,
      random: 'https://talaikis.com/api/quotes/random/',
      got: 'https://got-quotes.herokuapp.com/quotes'
    };
    const url = apiUrls[quoteType];
    const useJsonP = ['inspire'];

    return (useJsonP.includes(quoteType)) ? jsonPReq(url) : fetchReq(url); 
  };

  const fetchReq = (url) => {
    return fetch(url)
      .then((res) => res.json())
      .then(quoteCtrl)
      .catch((err) => alertCtrl('error', 'Request Error'));
  };

  const jsonPReq = (url) => {
    const [jsonPScriptEl] = makeTemplate('jsonP')(url);
    const docBody = document.body;
    docBody.appendChild(jsonPScriptEl);

    return docBody.lastChild.remove();
  };

  const formatQuote = (quote) => {
    return {
      quote: quote.quoteText || quote.quote.body || quote.quote,
      author: ((quote.quoteAuthor === '') ? 'Unknown' : quote.quoteAuthor)
        || quote.quote.author
        || quote.author
        || quote.character
    }
  };

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

  // ctrl flow after response => NOTE: public function so jsonP res can find it
  const quoteCtrl = (rawResponse) => {
    const formattedQuote = formatQuote(rawResponse);
    const template = makeTemplate('quote')(formattedQuote);
    const fragment = appendToFragment(template);
    removeKids(displaySection);
    setWikiTweetLinks(formattedQuote)
    
    return printer(displaySection, fragment);
  };

  return Object.freeze({prepReq, quoteCtrl});
})(GLOBAL);


/* FUNCTIONS FOR MANAGING DATA SAVED TO localStorage */
const favoriteModule = ((GLOBAL) => {
  const {favSection, clearFavBtn} = GLOBAL.els;
  const {
    alertCtrl,
    getElAttr,
    makeTemplate,
    removeKids,
    appendToFragment,
    printer
  } = GLOBAL;
  const store = localStorage;

  const getQuotes = () => JSON.parse(store.getItem('quotes'));
  const saveQuotes = (quotes) => {
    return store.setItem('quotes', JSON.stringify(quotes));
  };
  
  const printAll = () => {
    removeKids(favSection);
    if (!store.length) return clearFavBtn.hidden = true;
    const quotes = getQuotes();
    const TEMPLATESArr = quotes.map(makeTemplate('favorite'));
    const fragment = appendToFragment(TEMPLATESArr);
    clearFavBtn.removeAttribute('hidden');
  
    return printer(favSection, fragment);
  };

  const addOne = () => {
    const maxQuotes = 6;
    const currentQuotes = getQuotes();
    const newQuote = {
      quote: getElAttr('.display-quote', 'textContent'),
      author: getElAttr('.display-author', 'textContent'),
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
    const favDiv = element.parentElement.parentElement;
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
})(GLOBAL);


// initialize program
const init = ((els, alertCtrl, prepReq, favoriteModule) => {
  const {quoteButtons, newFavBtn, clearFavBtn, favSection} = els;
  const {printAll, addOne, removeOne, removeAll} = favoriteModule;

  // fetch 'random' quote on load & print any saved favorites
  prepReq('random');
  if (localStorage.length) printAll();

  // print an error msg to screen if no quote 2sec after load
  setTimeout(() => {
    if (!document.querySelector('.display-quote')) {
      const errMsg = 'There might be a request error. Please try again'

      return alertCtrl('error', errMsg);
    }
  }, 2000);

  /* event listeners */
  quoteButtons.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') return prepReq(e.target.id);
  });  
  newFavBtn.addEventListener('click', addOne);
  clearFavBtn.addEventListener('click', removeAll);
  favSection.addEventListener('click', (e) => {
    if (e.target.className === 'btn fav-remove') {
      return removeOne(e.target);
    }
  });
})(GLOBAL.els, GLOBAL.alertCtrl, quoteModule.prepReq, favoriteModule);
