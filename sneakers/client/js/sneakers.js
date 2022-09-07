
"use strict";

const sneakerSearchButton = document.getElementById('sneaker-search');
const topSection = document.getElementById('top');
const TESTING = true;
let notificationWindow = document.getElementById('notification-window');
const DOMAIN_NAME = TESTING && `http://localhost:` || `https://yoursneakercollection.com`;
const SERVER_PORT = 4020;
const LIMIT = 51;
const MAX_SNEAKERS_PER_ROW = 5;
const jordansSearchUrl = `/api/v1/sneakers/getJordans/${LIMIT}`;
const baseUrl = `${DOMAIN_NAME}`;

const sneakerCardHTML = `<div class="shoe">` +
                        `   <span class="shoe-name">$shoename</span>` +
                        `   <div class="img-container">`+
                        `       <img class = "mix-blend-mode" src="$image" alt="$alt-text"/>` +
                        `       <div class="price">` +
                        `             <span class="price-title">STOCKX</span>`+
                        `             <span class="price-stockx">$stockx-price</span>` +
                        `             <span class="price-title">GOAT</span>` +
                        `             <span class="price-goat">$goat-price</span>` +
                        `             <span class="price-title">FLIGHT CLUB</span>` +  
                        `             <span class="price-flight-club">$flight-club-price</span>` +
                        `       </div>` +
                        `   </div>` + 
                        `</div>`;




const sneakerSearchBar = document.getElementById('sneaker-search');
const loggingEnabled = false;
let body;

const searchJordans = (value) => {
  console.log(`${baseUrl + SERVER_PORT + jordansSearchUrl}`);
    loggingEnabled && console.log(`Retrieving the ${LIMIT} hottest sneakers..`); 
   
    axios.get(`${baseUrl + SERVER_PORT + jordansSearchUrl}`, body).then( res => {
    gotResults(res.data) && showSneakers(res.data) || showMessage(`Search did not return any data`);
    loggingEnabled && console.log(res.data);
  }).catch(err => {
    console.log(err);
  
  })
}

const searchSneakersByName = (sneakerName) => {
  try {
    console.log(`Sending a search request to the server.`);
    console.log(`Search value : ${sneakerName}`);
    sneakerSearchBar.disabled = false;
    const likeSneakerName = sneakerName;
    const generalSearchUrl = `/api/v1/sneakers/getSneakers/?limit=${LIMIT}&sneakername=${likeSneakerName}`;
    console.log(`${baseUrl + SERVER_PORT + generalSearchUrl}`); 
    axios.get(`${baseUrl + SERVER_PORT + generalSearchUrl}`, body).then (res => {
      gotResults(res.data) && showSneakers(res.data) || showMessage(`Your search results did not return any data.`);

    }).catch(err => {
      throw new Error(err);
    })
  } catch(e) {
      console.log('Error with sneaker search');
      console.log(e.stack);
  }
  finally {
    sneakerSearchBar.disabled = false;
  }
}



const displayPrice = (priceStr) => {
  return (priceStr !== undefined && '$' + priceStr) || 'N/A';

}

const gotResults =  (results) => {
  return results.length > 0;
} 

const showMessage = (message) => {
  notificationWindow.textContent = message;
  showMessageWindow();

}

const showMessageWindow = () => {
  console.log('Showing error message window.');
  !console.log('Adding the show class') && notificationWindow.classList.add('show');
}

const hideMessageWindow = () => {
  console.log('Hiding error message window.');
  !console.log('Removing the error message window.') && notificationWindow.classList.remove('show');

}

const recreateTriangleDownHeader = () => {
  const triangle = document.createElement('div');
  triangle.classList.add('triangle-down');
  topSection.appendChild(triangle);
}

const recreateNotificationWindow = () => {
  notificationWindow = document.createElement('div');
  notificationWindow.setAttribute('id', 'notification-window');
  topSection.appendChild(notificationWindow);
}

const showSneakers = (sneakers) => {
 
  hideMessageWindow();
  
  let shoeCount = 1;
  let sectionCount = 1;
  const lastRow = sneakers.length - 1;
  let currentRow = 0;
  let tempInnerHTML = '';
  recreateTriangleDownHeader();
  recreateNotificationWindow();
  //helper functions
  const setInnerHTMLToBlank = () => {tempInnerHTML = ''; return true};
  const resetShoeCount = () => shoeCount = 1;
  topSection.innerHTML = '';
  const triangle = document.createElement('div');
  triangle.classList.add('triangle-down');
  topSection.appendChild(triangle);
  console.log(sneakers);
  while (currentRow < lastRow) {
      let sneakerRow = sneakers[currentRow];
      tempInnerHTML = tempInnerHTML + sneakerCardHTML;
      loggingEnabled && console.log('%c'+ tempInnerHTML,"color: red");
      //get shoename, image, and alternative text from first shoe record
      tempInnerHTML = tempInnerHTML.replace('$shoename', sneakerRow.sneaker_name); 
      loggingEnabled && console.log(sneakerRow.reseller_name.toLowerCase());
      let goatProductId = sneakerRow.goat_product_id;
      tempInnerHTML = tempInnerHTML.replace('$image', sneakerRow.thumbnail_image);
      tempInnerHTML = tempInnerHTML.replace('$alt-text', sneakerRow.sneaker_name);
      //loop over remaing shoe records to get goat, stockx & flight club prices
      while (goatProductId === sneakerRow.goat_product_id && currentRow <= lastRow) {
        sneakerRow = sneakers[currentRow];
        loggingEnabled && onsole.log('%cSneaker Row: ',  "color: brown") && console.log(sneakerRow);
        const {sneaker_name, thumbnail_image, goat_product_id} = sneakerRow;
        loggingEnabled && console.log(sneaker_name, thumbnail_image, goat_product_id)
        tempInnerHTML = sneakerRow?.reseller_name?.toLowerCase() === 'goat' && 
          tempInnerHTML.replace('$goat-price', displayPrice(sneakerRow.price) || 'N/A') || tempInnerHTML
        tempInnerHTML = sneakerRow?.reseller_name?.toLowerCase() == 'flightclub' &&
          tempInnerHTML.replace('$flight-club-price', displayPrice(sneakerRow.price) || 'N/A') || tempInnerHTML;
        //console.log(tempInnerHTML);
        tempInnerHTML = sneakerRow?.reseller_name?.toLowerCase() === 'stockx' &&
          tempInnerHTML.replace('$stockx-price', displayPrice(sneakerRow.price) || 'N/A') || tempInnerHTML;
        currentRow++;
      }
      //when the goat product id changes we have a new shoe
      //update the shoe
  
      loggingEnabled && console.log('Calulating row space: ' + shoeCount % (MAX_SNEAKERS_PER_ROW  * shoeCount / MAX_SNEAKERS_PER_ROW + 1));
      shoeCount % MAX_SNEAKERS_PER_ROW === 0 && 
        setSectionInnerHTML(addNewSneakerSectionToTopDiv(createNewSneakerSection(sectionCount++)), tempInnerHTML) &&
        setInnerHTMLToBlank() && resetShoeCount() || shoeCount++;
  
  }
  loggingEnabled && console.log(tempInnerHTML);
  tempInnerHTML.length > 0 && 
    setSectionInnerHTML(addNewSneakerSectionToTopDiv(createNewSneakerSection(sectionCount)), tempInnerHTML);
  
  return true;
  
    
}

const createNewSneakerSection = (rowNum) => {
  loggingEnabled && console.log('Creating a new section.')
  const sneakerSection =  document.createElement(`section`);
  sneakerSection.classList.add('sneakers');
  sneakerSection.setAttribute('id','sneakers-row-' + rowNum);
  return sneakerSection;
}

const addNewSneakerSectionToTopDiv = (sneakerSection) => {
  loggingEnabled && console.log('adding section to top div.')
  topSection.appendChild(sneakerSection);
  return sneakerSection;
}

const setSectionInnerHTML = (sneakerSection, html) => {
  html = replaceUnknownPrices(html);
  loggingEnabled && console.log(html);
  sneakerSection.innerHTML = html;
  return true;
}

const replaceUnknownPrices = (html) => {
  loggingEnabled && console.log(`%cReplacing missing prices`,'color: dark-blue') && console.log('%c' + html, 'color: magenta');
  return html.replace('$stockx-price', displayPrice()).
    replace('$flight-club-price', displayPrice()).
    replace('$goat-price', displayPrice());
}

const INVALID_CHARS = "/'()[]{}.,<>||\/?+=*&^%$#@!~;`";

const validateInput = (input) => {

  for (const char of input) {
    if (INVALID_CHARS.includes(char)) {
       sneakerSearchBar.style.color = "red";
       console.log('Invalid Input');
       return false;
    }

  }
  sneakerSearchBar.style.color = "black";
  return true;

}


sneakerSearchBar.addEventListener('keypress', function (e) {
  loggingEnabled && console.log(sneakerSearchBar.value);
  validateInput(sneakerSearchBar.value) && e.key === 'Enter' && searchSneakersByName(sneakerSearchBar.value);

});



searchJordans(body);

