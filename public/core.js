const btnUser = document.getElementById("btnUser");
const userCard = document.getElementById("userCard");
const countryCard = document.getElementById("countryCard");
const exchangeCard = document.getElementById("exchangeCard");
const newsCard = document.getElementById("newsCard");
const statusEl = document.getElementById("status");

async function fetchJSON(url) {
  const r = await fetch(url);
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Request failed");
  return data;
}

btnUser.addEventListener("click", async () => {
  try {
    statusEl.textContent = "Loading the user...";
    userCard.classList.add("hidden");
    countryCard.classList.add("hidden");
    exchangeCard.classList.add("hidden");
    newsCard.classList.add("hidden");

    // 1)Random User
    const u = await fetchJSON("/api/random-user");

    userCard.innerHTML = `
      <h2>User Info</h2>
      <div class="row">
        <img class="avatar" src="${u.picture}" alt="Profile" />
        <div class="fields">
          <p><b>First name:</b> ${u.firstName}</p>
          <p><b>Last name:</b> ${u.lastName}</p>
          <p><b>Gender:</b> ${u.gender}</p>
          <p><b>Age:</b> ${u.age}</p>
          <p><b>Date of birth:</b> ${u.dateOfBirth}</p>
          <p><b>City:</b> ${u.city}</p>
          <p><b>Country:</b> ${u.country}</p>
          <p><b>Full address:</b> ${u.fullAddress}</p>
        </div>
      </div>
    `;
    userCard.classList.remove("hidden");

    // 2)Country Info
    statusEl.textContent = "Loading country info...";
    const country = await fetchJSON(`/api/country?name=${encodeURIComponent(u.country)}`);

    countryCard.innerHTML = `
      <h2>Country Info</h2>
      <div class="row">
        ${
          country.flag && country.flag !== "N/A"
            ? `<img class="flag" src="${country.flag}" alt="flag" />`
            : ""
        }
        <div class="fields">
          <p><b>Country name:</b> ${country.countryName}</p>
          <p><b>Capital city:</b> ${country.capital}</p>
          <p><b>Official language(s):</b> ${(country.languages || []).join(", ")}</p>
          <p><b>Currency:</b> ${(country.currency || []).join(", ")}</p>
        </div>
      </div>
    `;
    countryCard.classList.remove("hidden");

    // 3)Exchange Rate
    statusEl.textContent = "Loading exchange rates...";
    const baseCurrency = Array.isArray(country.currency) ? country.currency[0] : country.currency;

    if (!baseCurrency || baseCurrency === "N/A") {
      exchangeCard.innerHTML = `
        <h2>Exchange Rates</h2>
        <p>Currency not available.</p>
      `;
      exchangeCard.classList.remove("hidden");
    } else {
      const ex = await fetchJSON(`/api/exchange?base=${encodeURIComponent(baseCurrency)}`);

      const usdText = ex.USD === null ? "N/A" : ex.USD;
      const kztText = ex.KZT === null ? "N/A" : ex.KZT;

      exchangeCard.innerHTML = `
        <h2>Exchange Rates</h2>
        <p>1 ${ex.base} = ${usdText} USD, 1 ${ex.base} = ${kztText} KZT</p>
        <p class="muted">${ex.updated !== "N/A" ? `Updated: ${ex.updated}` : ""}</p>
      `;
      exchangeCard.classList.remove("hidden");
    }

    // 4)News API
    statusEl.textContent = "Loading news...";
    const news = await fetchJSON(`/api/news?country=${encodeURIComponent(u.country)}`);

    if (!Array.isArray(news) || news.length === 0) {
      newsCard.innerHTML = `
        <h2>News</h2>
        <p>No news found for this country.</p>
      `;
    } else {
      newsCard.innerHTML = `
        <h2>News</h2>
        ${news.map(n => `
          <div class="news-item">
            ${n.image ? `<img src="${n.image}" alt="news image" />` : ""}
            <div>
              <h3>${n.title || "No title"}</h3>
              <p>${n.description || "No description available."}</p>
              <a href="${n.url}" target="_blank" rel="noopener noreferrer">Read full article</a>
            </div>
          </div>
        `).join("")}
      `;
    }
    newsCard.classList.remove("hidden");

    statusEl.textContent = "";
  } catch (e) {
    statusEl.textContent = "Error: " + e.message;
  }
});