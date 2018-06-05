# random-ramblings

### Description
Random quote app. 
Uses different methods (just for practice), to get random quotes from 3 different APIs, depending on category that user selects.
Quote & author displayed & user can store up to 6 'favorite quotes' in local storage.

### User stories
- User can select to see a:
1. random quote from topic
2. random inspirational quote
3. random programming quote

- User can click a button to tweet quote

- User can click a button and be taken to quote author's Wikipedia page 

- User can save 6 quotes to a list of 'favorites' (stored in local storage), that will be displayed
- User can delete individual quotes from 'favorites'
- User can delete all 'favorites' at once

### Details
- Different (request) method used for each quote type - for the practice & chuckles:
1. 'random' quotes = XMLHttpRequest()
2. 'inspirational' quotes = JSONP
3. 'programming' quotes = fetch()
- Simple structure - no design patterns used. Functions are (arrow) function expressions.

### Author
Louis Foged