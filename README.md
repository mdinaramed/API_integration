Assignment 2: API
This project demonstrates how to integrate multiple APIs on the **server side** using Node.js and display the processed data on the frontend.  
All external API requests are performed in the backend, and the frontend only renders the cleaned JSON response.

## Features
Random User Generator (server-side fetch)
Country information based on the random user’s country (server-side fetch)
Exchange rate comparison to **USD** and **KZT** (server-side fetch)
News headlines based on the user’s country (server-side fetch)

## Project Structure
project-root/
server.js
package.json
.env.example
views/
index.html
public/
styles.css
app.js

### Where is the logic implemented?
**server.js**: all API calls (RandomUser, Country API, Exchange Rate, News API) work here.
**public/app.js**: frontend logic for button click + rendering cards using data returned from backend routes.
**views/index.html**: only HTML structure (no business logic).
**public/styles.css**: styling.

### API Usage (Server Side Only)
Random User API - Fetches a random user and extracts personal and location details.
Country API - Uses the user’s country name to retrieve country details such as capital, languages, currency, and flag.
Exchange Rate API - Compares the user’s local currency to USD and KZT.
News API - Retrieves up to five English news headlines related to the user’s country.
Only cleaned and relevant data is sent from the server to the frontend.

### Setup Instructions
1.Install dependencies: npm install
2.Create a .env file in the project root using .env.example and add your API keys.
3.Run the server on port 3000: npm run dev
4.Open the application in a browser: http://localhost:3000

## Requirements Covered
APIs run **only on the server side**
Frontend displays results in cards/sections with labeled fields and images
Work logic is implemented in JS files (backend + frontend JS), not inside HTML
Uses environment variables for API keys
Handles missing/unavailable data gracefully