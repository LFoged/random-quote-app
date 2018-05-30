# random-quote-app

### Description
Simple app that gets random quotes from 3 different APIs, depending on type of quote that user selects & displays quote + author.

### User stories
- User can select to see a:
-- random quote from topic
-- random inspirational quote
-- random programming quote

- User can click a button to tweet quote

- User can click a button and be taken to quote author's Wikipedia page 

- User can save 6 quotes to a list of 'favorites', that will be displayed
-- 'favorite' quotes are stored in localStorage
- User can delete individual quotes from 'favorites'
- User can delete all 'favorites' at once

### Details
- Different type of AJAX GET request made for each quote type - just for practice:
-- 'random' quotes = XMLHttpRequest()
-- 'inspirational' quotes = JSONP
-- 'programming' quotes = fetch()
- No design patterns used. Functions are function expressions (arrow functions)

### Author
Louis Foged