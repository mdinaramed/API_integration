const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// 1.Random User Generator API
app.get("/api/random-user", async (req, res) => {
  try {
    const response = await axios.get("https://randomuser.me/api/", {
      params: { results: 1 },
      timeout: 8000
    });

    const u = response.data.results[0];
    const payload = {
      firstName: u.name.first,
      lastName: u.name.last,
      gender: u.gender,
      picture: u.picture.large,
      age: u.dob.age,
      dateOfBirth: new Date(u.dob.date).toISOString().slice(0, 10),
      city: u.location.city,
      country: u.location.country,
      fullAddress: `${u.location.street.name} ${u.location.street.number}`
    };

    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch random user", details: err.message });
  }
});

// 2.Integrate Countrylayer API
app.get("/api/country", async (req, res) => {
  try {
    const name = req.query.name;
    if (!name) return res.status(400).json({ error: "Missing country name" });

    const KEY = process.env.COUNTRYLAYER_KEY;
    let countryName = "N/A";
    let capital = "N/A";
    let languages = [];
    let currency = [];
    let flag = "";

    if (KEY) {
      try {
        const url = `http://api.countrylayer.com/v2/name/${encodeURIComponent(name)}`;
        const r = await axios.get(url, { params: { access_key: KEY }, timeout: 8000 });
        const c = Array.isArray(r.data) ? r.data[0] : null;

        if (c) {
          countryName = c.name || countryName;
          capital = c.capital || capital;

          if (Array.isArray(c.languages)) {
            languages = c.languages.map(l => l.name).filter(Boolean);
          }
          if (Array.isArray(c.currencies)) {
            currency = c.currencies.map(x => x.code).filter(Boolean);
          }
          flag = c.flag || flag;
        }
      } catch (_) {
        // ignoring Countrylayer errors
      }
    }
    // достаточно ли данных, если нет то дополняем из restcountries.com
    const needMore = !languages.length || !currency.length || !flag;
    if (needMore) {
      const rc = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fullText=true`, { timeout: 8000 })
        .catch(async () => {
          return axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}`, { timeout: 8000 });
        });

      const d = Array.isArray(rc.data) ? rc.data[0] : null;
      if (d) {
        countryName = countryName !== "N/A" ? countryName : (d.name?.common || "N/A");
        capital = capital !== "N/A" ? capital : (Array.isArray(d.capital) ? d.capital[0] : "N/A");

        if (!languages.length && d.languages && typeof d.languages === "object") {
          languages = Object.values(d.languages).filter(Boolean);
        }

        if (!currency.length && d.currencies && typeof d.currencies === "object") {
          currency = Object.keys(d.currencies);
        }

        if (!flag) {
          flag = d.flags?.png || d.flags?.svg || "";
        }
      }
    }
    res.json({
      countryName,
      capital,
      languages: languages.length ? languages : ["N/A"],
      currency: currency.length ? currency : ["N/A"],
      flag: flag || "N/A"
    });
  } catch (e) {
    res.status(500).json({ error: "Server error", details: e.message });
  }
});

// 3.Exchange Rate API
app.get("/api/exchange", async (req, res) => {
  try {
    const base = (req.query.base || "").toUpperCase();
    if (!base) return res.status(400).json({ error: "Missing base currency" });

    const KEY = process.env.EXCHANGERATE_KEY;
    if (!KEY) return res.status(500).json({ error: "EXCHANGERATE_KEY missing in .env" });

    const url = `https://v6.exchangerate-api.com/v6/${KEY}/latest/${base}`;
    const response = await axios.get(url, { timeout: 8000 });

    const rates = response.data && response.data.conversion_rates;
    if (!rates) return res.status(502).json({ error: "Rates not found in API response" });

    const usd = rates.USD;
    const kzt = rates.KZT;

    res.json({
      base,
      USD: typeof usd === "number" ? usd : null,
      KZT: typeof kzt === "number" ? kzt : null,
      updated: response.data.time_last_update_utc || "N/A"
    });
  } catch (err) {
    const msg = err.response?.data?.error || err.response?.data?.message || err.message;
    res.status(500).json({ error: "ExchangeRate API error", details: msg });
  }
});

// 4.News API
app.get("/api/news", async (req, res) => {
  try {
    const country = req.query.country;
    if (!country) {
      return res.status(400).json({ error: "Missing country name" });
    }

    const KEY = process.env.NEWS_API_KEY;
    if (!KEY) {
      return res.status(500).json({ error: "NEWS_API_KEY missing in .env" });
    }
    const url = "https://newsapi.org/v2/everything";

    const response = await axios.get(url, {
      params: {
        q: country,         
        language: "en",
        pageSize: 5,
        sortBy: "publishedAt",
        apiKey: KEY
      },
      timeout: 8000
    });

const articles = response.data.articles || [];
const countryLower = country.toLowerCase();

let filtered = articles.filter(a =>
  typeof a.title === "string" &&
  a.title.toLowerCase().includes(countryLower)
);

if (filtered.length < 5) {
  const additional = articles.filter(a =>
    typeof a.description === "string" &&
    a.description.toLowerCase().includes(countryLower) &&
    !filtered.includes(a)
  );
  filtered = filtered.concat(additional);
}

const cleaned = filtered.slice(0, 5).map(a => ({
  title: a.title,
  image: a.urlToImage || null,
  description: a.description || "No description available.",
  url: a.url
}));

res.json(cleaned);  
  } catch (error) {
    const msg =
      error.response?.data?.message ||
      error.message ||
      "News API error";

    res.status(500).json({ error: msg });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});