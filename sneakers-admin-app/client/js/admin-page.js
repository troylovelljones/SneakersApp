'use strict';

const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const serverList = document.getElementById('server-list');
const tableBody = document.getElementById('log-message-rows');
//serverList.
//no searching until the UI is configured
searchInput.disabled = true;
searchButton.disabled = true;
const loggingEnabled = true;
let sneakersApiServerUrl;

const fakeServerData = [
  {serverName: 'authentication-server', ipAddress: '192.168.200.1', port: 4000, status: 'Available'},
  {serverName: 'registry-server', ipAddress: '192.168.200.2', port: 4400, status: 'Available'},
  {serverName: 'user-login-server', ipAddress: '192.168.200.3', port: 4100, status: 'Available'},
  {serverName: 'log-entries-server', ipAddress: '192.168.200.4', port: 4200, status: 'Available'},
  {serverName: 'authentication-server', ipAddress: '192.168.200.5', port: 4600, status: 'Offline'},

];

const fakeLogMessages = [
  {
    label: '192.168.1.201',
    level: '\x1B[32minfo\x1B[39m',
    message: 'model.js[traceId] equals 7e2c5a09-3f24-438d-96f9-0315ce720713',
    module: 'logger-manager.js',
    ms: '+0ms',
    phase: 'startup',
    serverName: 'auth-api-svr',
    timestamp: '2022-10-29T07:19:44.413Z',
    traceId: '7e2c5a09-3f24-438d-96f9-0315ce720713'
  },
  {
    label: '192.168.1.201',
    level: '\x1B[32minfo\x1B[39m',
    message: 'authorize-servers-routes.js[traceId] equals 7e2c5a09-3f24-438d-96f9-0315ce720713',
    module: 'logger-manager.js',
    ms: '+0ms',
    phase: 'startup',
    serverName: 'auth-api-svr',
    timestamp: '2022-10-29T07:19:44.415Z',
    traceId: '7e2c5a09-3f24-438d-96f9-0315ce720713'
  },
  {
    label: '192.168.1.201',
    level: '\x1B[32minfo\x1B[39m',
    message: 'traceId will be set to 7e2c5a09-3f24-438d-96f9-0315ce720713.',
    module: 'logger-manager.js',
    ms: '+2ms',
    phase: 'startup',
    serverName: 'auth-api-svr',
    timestamp: '2022-10-29T07:19:44.415Z',
    traceId: '7e2c5a09-3f24-438d-96f9-0315ce720713'
  },
  {
    label: '192.168.1.201',
    level: '\x1B[33mwarn\x1B[39m',
    message: "Module generate-trace-info.js does not support logging, generate-trace-info.js.getModuleLoggingMetaData() doesn't exist.",
    module: 'logger-manager.js',
    ms: '+0ms',
    phase: 'startup',
    serverName: 'auth-api-svr',
    timestamp: '2022-10-29T07:19:44.415Z',
    traceId: '7e2c5a09-3f24-438d-96f9-0315ce720713'
  },
  {
    label: '192.168.1.201',
    level: '\x1B[32minfo\x1B[39m',
    message: 'Dependendency =  config-file.js.',
    module: 'logger-manager.js',
    ms: '+0ms',
    phase: 'startup',
    serverName: 'auth-api-svr',
    timestamp: '2022-10-29T07:19:44.415Z',
    traceId: '7e2c5a09-3f24-438d-96f9-0315ce720713'
  },
  {
    label: '192.168.1.201',
    level: '\x1B[33mwarn\x1B[39m',
    message: "Module authorize-users-routes.js does not support logging, authorize-users-routes.js.getModuleLoggingMetaData() doesn't exist.",
    module: 'logger-manager.js',
    ms: '+0ms',
    phase: 'startup',
    serverName: 'auth-api-svr',
    timestamp: '2022-10-29T07:19:44.415Z',
    traceId: '7e2c5a09-3f24-438d-96f9-0315ce720713'
  },
  {
    label: '192.168.1.201',
    level: '\x1B[32minfo\x1B[39m',
    message: 'Property = traceId',
    module: 'logger-manager.js',
    ms: '+0ms',
    serverName: 'auth-api-svr',
    timestamp: '2022-10-29T07:19:44.415Z'
  }
];

const fakeErrorData = [
  {module: 'logger.js', count: 3},
  {module: 'secrets.js', count: 7},
  {module: 'token.js', count: 10}, 
  {module: 'password.js', count: 13},
  {module: 'locate.js', count: 34},
  {module: 'app-utils.js', count: 22}
];

const fakeRequestData = [
  {server: 'auth-api', count: 1300},
  {server: 'reg-api', count: 900},
  {server: 'user-login-app', count: 120}, 
  {server: 'sneaks-app', count: 300},
  {server: 'sneaks-api', count: 500},
]

const healthDataPointHtml =  `<img src="../images/cloud-server.png" alt="server jordan icon" width="100" height="50">` +
                            `<span class="bold">Server Name:</span>` +
                            `<span class="bold">$serverName</span>` +
                            `<span class ="bold">IP address:</span>` +
                            `<span class="bold">$ipAddress</span>` +
                            `<span class ="bold">Port: $port</span>` +
                            `<span class="bold">Status: <span class="server-health-text $sts-class bold">$status</span>`;

const logMessage =          `<tr table-primary>` +
                              `<td class="no-word-wrap bold log-date ">$timestamp</td>` +
                              `<td class="$msg-color bold">$level</td>`+
                              `<td class="bold no-word-wrap">$module</td>` +
                              `<td class="bold">$phase</td>` +
                              `<td class="bold">$msg</td>` +
                              `<td class="no-word-wrap bold">$trace-id</td>
                            </tr>`;

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
  element.innerHTML = '';
};

const error = (e) => {
  e?.stack &&
    console.log(`%cError: %c${e.stack}`, 'color: red', 'color: orange');
  e?.message &&
    console.log(`%cError: %c${e.message}!`, 'color: red', 'color: orange');
  e?.message?.data &&
    console.log(`%cError: %c${e.response.data}`, 'color: red', 'color: orange');
};

const generalSearch = async (searchOptions) => {
    try {
      searchInput.disabled = false;
      console.log(apiServer.ipAddress + apiServer.port + apiServer.endPoint);
      const results = await axios.get(logServerUrl);
      showMessage(`Return log data.`);
    } catch (e) {
        console.log('Error with log search');
        console.log(e.stack);
        throw e;
    } finally {
        searchInput.disabled = false;
    }
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

const getLogMessages = messages => {
  let msgNumber = 1;
  console.log('Getting log messages...');
  console.log(tableBody);
  clearHtml(tableBody);
  messages.forEach(message => {
    const tableRow = document.createElement('tr');
    tableRow.id = `log-message-${msgNumber++}`;
    tableRow.innerHTML = logMessage
      .replace('$timestamp', message.timestamp)
      .replace('$msg-color', 'black')
      .replace('$level', message.level
        .replace('\x1B[32m','')
        .replace('\x1B[39m','')
        .replace('\x1B[33m',''))
      .replace('$module', message.module)
      .replace('$phase',  message.phase && message.phase.toUpperCase() || '')
      .replace('$msg', message.message)
      .replace('$trace-id', message.traceId);
      tableBody.appendChild(tableRow);
      console.log(tableRow.innerHTML);

   });
}

const getServerHealthDataPoints = data => {
  let serverNumber = 1;
  console.log('Getting server data...');
  clearHtml(serverList);
  data.forEach(dataPoint => {
    const serverHealthDataPoint = document.createElement('li');
    serverHealthDataPoint.classList.add('health-data-point');
    serverHealthDataPoint.id = `server-${serverNumber++}`;
    const statusClass = dataPoint.status === 'Available' ? 'server-available' : 'server-unavailable';
    serverHealthDataPoint.innerHTML = 
      healthDataPointHtml
        .replace('$num', serverNumber)
        .replace('$serverName', dataPoint.serverName)
        .replace('$ipAddress',dataPoint.ipAddress)
        .replace('$port', dataPoint.port)
        .replace('$status', dataPoint.status)
        .replace('$sts-class', statusClass);
    serverList.appendChild(serverHealthDataPoint);
    console.log(serverHealthDataPoint.innerHTML);
  })
  
}

const getModuleErrors = () => {
  return fakeErrorData;
}

const getReqeustErrors = () => {
  return fakeRequestData;
}

const gotResults = (results) => {
  return results.length > 0;
};

const getUrls = async () => {
  /*const url = location.protocol
    .concat('//')
    .concat(location.hostname)
    .concat(':')
    .concat(location.port)
    .concat('/admin-app-server/links');*/
  try {
    
    //const response = await axios.get(url);
    //return response.data;
    return {searchLogUrl: 'http://localhost:80/sneaker-logger-api//server/logs'}
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

const searchLogs = (criteria) => {
  console.log('Searching logs');
}

const showMessage = (message) => {
  const top = document.getElementById('top');
  clearHtml(top);
  recreateTriangleDownHeader();
  const messageWindow = createNotificationWindow();
  messageWindow.textContent = message;
  showMessageWindow(messageWindow);
};

const showMessageWindow = (messageWindow) => {
  console.log('Showing error message window.');
  messageWindow.classList.add('show') && console.log('Added the show class');
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
google.charts.load('current',{packages:['corechart']});
google.charts.setOnLoadCallback(drawCharts);         
  
function drawCharts() {
    // Set Data
    const errorData = getModuleErrors().map(error => [error.module, error.count]);
    errorData.unshift(['Module', 'Errors']);
    let data = google.visualization.arrayToDataTable(errorData); 
    // Set Options
    let options = {
      hAxis: { 
        direction: 1, 
        slantedText: true, 
        slantedTextAngle: 30, 
        titleTextStyle: { fontSize: 12,  bold: true },
        fontSize: 6
      },
      vAxis: { 
        title: 'Cummulative Number of Errors', 
        titleTextStyle: { fontSize: 12, bold: true },
        fontSize: 6
      }
    }
    // Draw charts
    let chart = new google.visualization.LineChart(document.getElementById('ModuleErrorsChart'));
    chart.draw(data, options);    
    const requestData = getReqeustErrors().map(request => [request.server, request.count]);
    requestData.unshift(['Server','Requests'])
    data = google.visualization.arrayToDataTable(requestData);       
    options = {pieHole: 0.4, chartArea: {width: '80%', height: '80%'}};
    chart = new google.visualization.PieChart(document.getElementById('RequestsByServerPieChart'));   
    chart.draw(data, options);
}

(async () => {
  $(function () {
    console.log('ready!');
  });
  try {
    //const params = getQueryStringParameters(); //gets the token off the url query string
    //const { id, token, type } = params;
    //const newToken = await refreshToken(token, type, id); //gets a new token to replace the token on the url query string
    //Get the api links we need from the application server
    //const response = await getUrls();
    //const logoutUrl = location.host + `:${port}/login`;
    //logoutLink.addEventListener('click', appLogout(logoutUrl));
    searchInput.addEventListener(
      'keypress',
      (e) => e.key === 'Enter' && searchSneakers()
    );
    getServerHealthDataPoints(fakeServerData);
    getLogMessages(fakeLogMessages);
    searchInput.disabled = false;
    searchButton.disabled = false;
    searchButton.addEventListener('click', searchLogs);
    //default search
  } catch (e) {
    !e.errorLogged && error(e);
    showMessage('Please try to refresh the page.');
    throw e;
  }
})();
