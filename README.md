# random-quote-app

### Description
Simple app that gets random quotes from 3 different APIs, depending on type of quote that user selects & displays quote + author.

### User stories
- User can select to see a:
1. random quote from topic
2. random inspirational quote
3. random programming quote

- User can click a button to tweet quote

- User can click a button and be taken to quote author's Wikipedia page 

- User can save 6 quotes to a list of 'favorites', that will be displayed
-- 'favorite' quotes are stored in localStorage
- User can delete individual quotes from 'favorites'
- User can delete all 'favorites' at once

### Details
- Different type of AJAX GET request made for each quote type - just for practice:
1. 'random' quotes = XMLHttpRequest()
2. 'inspirational' quotes = JSONP
3. 'programming' quotes = fetch()
- No design patterns used. Functions are function expressions (arrow functions)

### Author
Louis Foged