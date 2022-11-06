'use strict';

const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
//no searching until the UI is configured
searchInput.disabled = true;
searchButton.disabled = true;
const TESTING = true,
  LIMIT = 1000,
  MAX_SNEAKERS_PER_ROW = 5;
const sneakerCardHtml =
  `<div class="shoe">` +
  `   <span class="shoe-name">$shoename</span>` +
  `   <div class="favorites"><i class="fa fa-heart-o fa-3x"></i></div>` +
  `   <div class="img-container">` +
  `       <img class = "mix-blend-mode" src="$image" alt="$alt-text"/>` +
  `       <div class="price">` +
  `             <span class="price-title">STOCKX</span>` +
  `             <span class="price-stockx">$stockx-price</span>` +
  `             <span class="price-title">GOAT</span>` +
  `             <span class="price-goat">$goat-price</span>` +
  `             <span class="price-title">FLIGHT CLUB</span>` +
  `             <span class="price-flight-club">$flight-club-price</span>` +
  `       </div>` +
  `   </div>` +
  `</div>`;

const loggingEnabled = true;
let sneakersApiServerUrl;

const addPartialSneakerRow = (sectionCount, html) => {
  const section = createNewSneakerSection(sectionCount);
  addNewSneakerSectionToTopDiv(section);
  setSectionInnerHtml(section, html);
};

const addSneakerCardHtml = (html) => {
  return html + sneakerCardHtml;
};

const addSneakerRow = (sectionCount, html) => {
  console.log('Adding sneaker row ' + sectionCount);
  const section = createNewSneakerSection(sectionCount);
  addNewSneakerSectionToTopDiv(section);
  setSectionInnerHtml(section, html);
};

const addNewSneakerSectionToTopDiv = (section) => {
  loggingEnabled && console.log('adding section to top div.');
  const top = document.getElementById('top');
  top.appendChild(section);
  return section;
};

const appLogout = (logoutUrl) => {
  return (e) => {
    e.preventDefault();
    console.log(logoutUrl);
    window.location.replace(logoutUrl);
  };
};

const createNotificationWindow = () => {
  const getMessageWindow = () => {
    return document.getElementById('notification-window');
  };

  const top = document.getElementById('top');
  const messageWindow = getMessageWindow() || document.createElement('div');
  messageWindow.setAttribute('id', 'notification-window');
  top.appendChild(messageWindow);
  return messageWindow;
};

const clearHtml = (element) => {
  element.innerHtml = '';
};

const createNewSneakerSection = (rowNum) => {
  loggingEnabled && console.log('Creating a new section.');
  const section = document.createElement(`section`);
  section.classList.add('sneakers');
  section.setAttribute('id', 'sneakers-row-' + rowNum);
  return section;
};

const displayPrice = (priceStr) => {
  return (priceStr !== undefined && '$' + priceStr) || 'N/A';
};

const displayResellerPrices = (reseller, price, html) => {
  html =
    reseller === 'goat'
      ? html.replace('$goat-price', displayPrice(price) || 'N/A')
      : html;
  html =
    reseller == 'flightclub'
      ? html.replace('$flight-club-price', displayPrice(price) || 'N/A')
      : html;
  html =
    reseller === 'stockx'
      ? html.replace('$stockx-price', displayPrice(price) || 'N/A')
      : html;
  return html;
};

const displaySneakerImage = (html, name, image) => {
  html = html.replace('$shoename', name);
  html = html.replace('$image', image);
  html = html.replace('$alt-text', name);
  return html;
};

const generalSearch = (apiServerInfo) => {
  return async (sneakerName) => {
    try {
      searchInput.disabled = false;
      const likeSneakerName = sneakerName;
      console.log(apiServer.ipAddress + apiServer.port + apiServer.endPoint);
      const results = await axios.get(sneakersApiServerUrl);
      (gotResults(results) && showSneakers(results)) ||
        showMessage(`Your search results did not return any data.`);
    } catch (e) {
      console.log('Error with sneaker search');
      console.log(e.stack);
      throw e;
    } finally {
      searchInput.disabled = false;
    }
  };
};

const gotResults = (results) => {
  return results.length > 0;
};

const getQueryStringParameters = () => {
  const url = window.location.href;
  console.log(url);
  const params = {};
  url
    .split('?')[1]
    .split('&')
    .forEach((pair) => {
      const keyValue = pair.split('=');
      const key = keyValue[0];
      const value = keyValue[1];
      params[key] = value;
    });
  return params;
};

const getUrls = async () => {
  const url = location.protocol
    .concat('//')
    .concat(location.hostname)
    .concat(':')
    .concat(location.port)
    .concat('/sneaker-app-server/links');
  try {
    console.log(url);
    const response = await axios.get(url);
    return response.data;
  } catch (e) {
    console.log(e);
    console.log(e.stack);
    showMessage(
      'Encountered an error contacting the server. Please refresh the page and try again.'
    );
  }
};

const hideMessageWindow = (messageWindow) => {
  console.log('Hiding error message window.');
  messageWindow.classList.remove('show') &&
    console.log('Removing the error message window.');
};

const error = (e) => {
  e?.stack &&
    console.log(`%cError: %c${e.stack}`, 'color: red', 'color: orange');
  e?.message &&
    console.log(`%cError: %c${e.message}!`, 'color: red', 'color: orange');
  e?.message?.data &&
    console.log(`%cError: %c${e.response.data}`, 'color: red', 'color: orange');
};

const processRouteData = (data) => {
  console.log('Got Route data!');
  console.log(data);
  const { endPoints, ipAddress, port } = data;
  return { ipAddress, port, endPoints };
};

const recreateTriangleDownHeader = () => {
  if (document.getElementById('triangle-down')) return;
  console.log('Recreating down triangle navbar accent...');
  const cntr = document.getElementById('dark-row');
  const triangle = document.createElement('div');
  triangle.setAttribute('id', 'triangle-down');
  cntr.appendChild(triangle);
};

const replaceUnknownPrices = (html) => {
  loggingEnabled &&
    console.log(`%cReplacing missing prices`, 'color: dark-blue') &&
    console.log('%c' + Html, 'color: magenta');
  return html
    .replace('$stockx-price', displayPrice())
    .replace('$flight-club-price', displayPrice())
    .replace('$goat-price', displayPrice());
};

const resetShoeCount = (shoeCount) => {
  return 1;
};

const refreshToken = async (token, type, id) => {
  try {
    const url = 'http://'
      .concat(location.hostname)
      .concat(':')
      .concat(location.port)
      .concat('/sneaker-app-server/refreshToken?token=%TOKEN&type=%TYPE&id=%ID')
      .replace('%TOKEN', token)
      .replace('%TYPE', type)
      .replace('%ID', id);
    console.log(url);
    const response = await axios.get(url);
    return response.data;
  } catch (e) {
    console.log(e);
    console.log(e.stack);
    showMessage(
      'Encountered an error contacting the server. Please refresh the page and try again.'
    );
  }
};

const showMessage = (message) => {
  const top = document.getElementById('top');
  clearHtml(top);
  recreateTriangleDownHeader();
  const messageWindow = createNotificationWindow();
  messageWindow.textContent = message;
  showMessageWindow(messageWindow);
};

const searchJordans = (url) => {
  return () => {
    loggingEnabled && console.log(`${url.replace(':limit', LIMIT)}`);
    loggingEnabled && console.log(`Retrieving the ${LIMIT} hottest sneakers..`);
    axios
      .get(`${url.replace(':limit', LIMIT)}`, body)
      .then((res) => {
        console.log(res.data);
        (gotResults(res.data) && showSneakers(res.data)) ||
          showMessage(`Search did not return any data`);
        loggingEnabled && console.log(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };
};

const setSectionInnerHtml = (section, html) => {
  html = replaceUnknownPrices(html);
  section.innerHTML = html;
  const icons = section.querySelectorAll('i');
  icons.forEach((icon) => icon.addEventListener('click', toggleSneakerIcons));
  return true;
};

const showMessageWindow = (messageWindow) => {
  console.log('Showing error message window.');
  messageWindow.classList.add('show') && console.log('Added the show class');
};

const showSneakers = (sneakers) => {
  const lastRow = sneakers.length - 1;
  const top = document.getElementById('top');
  let shoeCount = 1,
    sectionCount = 1,
    currentRow = 0,
    tempInnerHtml = '';
  const messageWindow = document.getElementById('notification-window');
  const triangleDown = document.getElementById('triangle-down');
  messageWindow && hideMessageWindow(messageWindow);
  triangleDown && recreateTriangleDownHeader();
  clearHtml(top);
  while (currentRow < lastRow) {
    //outer loop loops over shoes
    const sneakerRow = sneakers[currentRow];
    const goatProductId = sneakerRow.goat_product_id;
    tempInnerHtml = addSneakerCardHtml(tempInnerHtml);
    //get shoename, image, and alternative text from first shoe record
    tempInnerHtml = displaySneakerImage(
      tempInnerHtml,
      sneakerRow.sneaker_name,
      sneakerRow.thumbnail_image
    );
    //loop over remaing shoe records to get goat, stockx & flight club prices
    while (
      currentRow <= lastRow &&
      goatProductId === sneakers[currentRow].goat_product_id
    ) {
      //inner loop loops over shoe resellers/prices
      const sneakerRow = sneakers[currentRow];
      const reseller = sneakerRow?.reseller_name?.toLowerCase();
      const price = sneakerRow.price;
      tempInnerHtml = displayResellerPrices(reseller, price, tempInnerHtml);
      currentRow++;
      console.log(`Current row: ${currentRow}, Last row: ${lastRow}`);
    }
    //when the goat product id changes we have data for a new shoe, update the shoe count
    //when we have the maximum number of shoes per section,create a new section;
    loggingEnabled &&
      console.log(
        'Calulating row space: ' +
          (shoeCount %
            ((MAX_SNEAKERS_PER_ROW * shoeCount) / MAX_SNEAKERS_PER_ROW + 1))
      );
    shoeCount % MAX_SNEAKERS_PER_ROW === 0
      ? addSneakerRow(sectionCount++, tempInnerHtml)
      : shoeCount++;
    currentRow++;
  }

  //the remaining shoe data that didn't quite fill the row
  tempInnerHtml =
    tempInnerHtml.length > 0
      ? addPartialSneakerRow(sectionCount, tempInnerHtml)
      : tempInnerHtml;

  return true;
};

const searchSneakers = (e) => {
  e.preventDefault();
  loggingEnabled && console.log(searchInput.value);
  validateInput(searchInput.value);
  sneakerSearch(searchInput.value);
};

const toggleFavoritesLink = (e) => {
  e.preventDefault();
  console.log('anchor clicked');
  const text = e.target.text;
  e.target.text = text === 'Favorites' ? 'All' : 'Favorites';
};

const toggleSneakerIcons = (e) => {
  e.preventDefault();
  console.log(e);
  const classList = e.target.classList;
  (classList.contains('fa-heart-o') &&
    !classList.toggle('fa-heart-o') &&
    classList.toggle('fa-heart')) ||
    (classList.contains('fa-heart') &&
      !classList.toggle('fa-heart') &&
      classList.toggle('ico-sneaker-closet')) ||
    (classList.contains('ico-sneaker-closet') &&
      !classList.toggle('ico-sneaker-closet') &&
      classList.toggle('fa-heart-o'));
};

const validateInput = (input) => {
  const INVALID_CHARS = "/'()[]{}.,<>||/?+=*&^%$#@!~;`";
  for (const char of input) {
    if (INVALID_CHARS.includes(char)) {
      searchInput.style.color = 'red';
      console.log('Invalid Input');
      return false;
    }
  }
  searchInput.style.color = 'black';
  return true;
};

//-------------JQuery functions------------//
// Shorthand for $( document ).ready()
$(function () {
  console.log('ready!');
});

let mnuOut = false;
$('#hamburger-icon').click(function () {
  console.log('Clicked!');
  if (mnuOut) {
    //Menu is visible, so HIDE menu
    $('#sneaker-menu').animate(
      {
        left: '-400px'
      },
      800
    );
    mnuOut = false;
  } else {
    //Menu is hidden, so SHOW menu
    $('#sneaker-menu').animate(
      {
        left: 0
      },
      800
    );
    mnuOut = true;
  }
});

$('#x-button').click(function () {
  if (mnuOut) {
    //Menu is visible, so HIDE menu
    $('#sneaker-menu').animate(
      {
        left: '-400px'
      },
      800
    );
    mnuOut = false;
  }
});

(async () => {
  $(function () {
    console.log('ready!');
  });
  try {
    const params = getQueryStringParameters(); //gets the token off the url query string
    const { id, token, type } = params;
    const newToken = await refreshToken(token, type, id); //gets a new token to replace the token on the url query string
    //Get the api links we need from the application server
    const response = await getUrls();
    console.log(response);
    const { jordansSearchUrl, sneakerSearchUrl } = response;
    const logoutUrl = location.host + `:${port}/login`;
    logoutLink.addEventListener('click', appLogout(logoutUrl));
    searchInput.addEventListener(
      'keypress',
      (e) => e.key === 'Enter' && searchSneakers()
    );
    favoritesLink.addEventListener('click', toggleFavoritesLink);
    console.log('Search Input');
    console.log(searchInput);
    console.log('Search Button');
    console.log(searchButton);
    searchInput.disabled = false;
    searchButton.disabled = false;
    const sneakerSearch = generalSearch(location.host + sneakerSearchUrl);
    searchButton.addEventListener('click', sneakerSearch);
    //default search
    const jordansSearch = searchJordans(location.host + jordansSearchUrl);
    jordansSearch(jordansSearchUrl);
  } catch (e) {
    !e.errorLogged && error(e);
    showMessage('Please try to refresh the page.');
    throw e;
  }
})();
