/* +===============================================================================================================+
-- |				                                       					     		                	                             |
-- |Author: Rakesh Vagvala				                        	     		                	                             |
-- |Initial Build Date: 	    		                             	                     	                             |
-- |Source File Name: iTranslate.js			            	                     	                           	 		       |
-- |									     			                                                                                   |
-- |Object Name: 					                                	     		                	                             |
-- |Description: This is used to enable translation on any web page, initially started to support                  |
-- |             OAF Page in Oracle Apps                                                                           |
-- |								  	     		                                                    	                             |
-- |Dependencies:	This is referred by ITranslateCO from any of the OAF Pages to weave its magic					   	       |
-- |              g_query and g_translations are pre-requisites for iTranslate                                     |
-- |              These are module specific & can be ingested into page from ITranslateCO                          |
-- |								   	     		                                                    	                             |
-- |Usage:        Invoke addLanguageSelector() function from any OAF Page to enable the language selection dropdown|
-- |									     		                                                      	                             |
-- |Modification History:			                        				     	                	                             |
-- |===============						                              	     	                	                             |
-- |Version       Date          Author                  Remarks			              		                             |
-- |=========   =============  =========               =============================                               |
-- |1.0         02-NOV-2019    Rakesh Vagvala	        Initial version                                    	         |
-- +==============================================================================================================+ */

/*Declaring global variables*/

const g_itranslate_usr_pref_lng = 'iTranslate-UserPreferredLanguage';
const g_translation_success = '2px solid #28a745';
const g_translation_notfound = '2px solid #dc3545';

/*Below variables will be loaded from Config file and will have to be explicitly set by the module which implements iTranslate*/
let g_supported_languages = [];
let g_add_language_selector_on = 'header';
let g_language_selector_style;
let g_enable_retranslate_on;
let g_spacer_html = '&nbsp;';
let g_query;
let g_translations = [];

/*Below defaults can be overridden through the Config file or iTranslate Constructor*/
let g_current_language = 'english';
let g_debug = false;


/*
  logException: function to log exceptions to console
*/
function logException(functionName, errorMessage) {
  console.log(`Error in ${functionName} is ${errorMessage}`);
}

/*
  getjson: function to read json from a network file
*/
function getjson(url, method, data) {
  return new Promise(function(resolve, reject) {
    let request = new XMLHttpRequest();
    request.responseType = 'json';
    request.onreadystatechange = function() {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          resolve(request.response);
        } else {
          reject(Error(request.status));
        }
      }
    };
    request.onerror = function() {
      reject(Error("Network Error"));
    };
    request.open(method, url, true);
    request.send(data);
  });
}

/*
  createCookie: function to save user preferences to cookie
*/
function createCookie(cookieName,cookieValue,daysToExpire)
{
  try {
    const date = new Date();
    date.setTime(date.getTime()+(daysToExpire*24*60*60*1000));
    document.cookie = `${cookieName}=${cookieValue}; expires=${date.toGMTString()}`;
  }
  catch(err) {
    logException('createCookie', err.message);
  }
}

/*
  getCookie: function to retrieve user preferences from cookie
*/
function getCookie(cookieName)
{
  let _cookieValue = '';
  try {
    const _cookieName = `${cookieName}=`;
    const _cookies = document.cookie.split(';');

    _cookies.forEach((cookie, index) => {
      const _cookie = cookie.trim();
      if (_cookie.indexOf(_cookieName)==0) {
        _cookieValue = _cookie.substring(_cookieName.length,_cookie.length);
        return _cookieValue;
      }
    });

  }
  catch(err) {
    logException('getCookie', err.message);
  }
	return _cookieValue;
}

/*
  saveUserPreferredLanguage: function to save user language preference to cookie
*/
function saveUserPreferredLanguage(selectedLanguage) {
  try {
      createCookie(g_itranslate_usr_pref_lng, selectedLanguage, 365);
  }
  catch(err) {
    logException('saveUserPreferredLanguage', err.message);
  }
}

/*
  getUserPreferredLanguage: function to retrieve user language preference from cookie
*/
function getUserPreferredLanguage() {
  try {
    return getCookie(g_itranslate_usr_pref_lng);
  }
  catch(err) {
    logException('getUserPreferredLanguage', err.message);
  }
  return "";
}

/*
  setCurrentLanguage: function to set currentLanguage to global variable
*/
function setCurrentLanguage(currentLanguage) {
  g_current_language = currentLanguage;
}

/*
  setDebugMode: function to set debugMode to global variable
*/
function setDebugMode(debugMode) {
  g_debug = debugMode;
}

/*
  setSpacerHtml: function to set spacer html to global variable
*/
function setSpacerHtml(spacerHtml) {
  g_spacer_html = spacerHtml;
}

/*
  setAddLanguageSelectorOn: function to set css query path value of language selector to global variable
*/
function setAddLanguageSelectorOn(addLanguageSelectorOn) {
  g_add_language_selector_on = addLanguageSelectorOn;
}

/*
  setReTranslateOn: function to set css query path value of retranslate to global variable
*/
function setReTranslateOn(enableRetranslateOn) {
  g_enable_retranslate_on = enableRetranslateOn;
}

/*
  addQuery: function to add support for query criteria to iTranslate
*/
function addQuery(query) {
  try {
      if(!g_query) {
        g_query = query;
      }
      else {
        g_query = `${g_query}, ${query}`;
      }
  }
  catch(err) {
    logException('addQuery', err.message);
  }
}

/*
  addTranslations: function to add support for translations to iTranslate
*/
function addTranslations(translations) {
  try {
    if(!g_translations) {
      g_translations = translations;
    }
    else {
      g_translations = g_translations.concat(translations);
    }
  }
  catch(err) {
    logException('addTranslations', err.message);
  }
}

/*
  extractStringBetween: function to extract substring between 2 strings
*/
function extractStringBetween(str, prefix, suffix) {
  try {
  	let i = str.indexOf(prefix);
  	if (i >= 0) {
  		str = str.substring(i + prefix.length);
  	}
  	else {
  		return '';
  	}
  	if (suffix) {
  		i = str.indexOf(suffix);
  		if (i >= 0) {
  			str = str.substring(0, i);
  		}
  		else {
  		  return '';
  		}
  	}
  }
  catch(err) {
    logException('extractStringBetween', err.message);
  }
	return str;
};

/*
  isMessageMatched: function to check if the text in html dom element matches to a given message from translation store
*/
function isMessageMatched(actualMsg, currentMsg) {
  try {
  	const msg_tokens = actualMsg.match(/&[A-Za-z0-9^_]+/g);
  	const msg_parts = actualMsg.split(/&[A-Za-z0-9^_]+/);
  	const msg_token_values = [];
  	let msg_derived = actualMsg;
  	msg_tokens.forEach((token, index) => {
  		const token_value = extractStringBetween(currentMsg, msg_parts[index], msg_parts[index+1]);
  	  msg_token_values.push(token_value);
  		msg_derived = msg_derived.replace(token, token_value);
  	});
  	return (currentMsg === msg_derived);
  }
  catch(err) {
    logException('isMessageMatched', err.message);
  }
  return false;
};

/*
  isTextMatched: function to check if the text in html dom element matches to a given text from translation store
*/
function isTextMatched(msgType, actualMsg, currentMsg) {
  try {
    if(msgType !== 'message')
      return actualMsg.toUpperCase().replace('\n','')===currentMsg.toUpperCase().replace('\n','');
    else
      return isMessageMatched(actualMsg, currentMsg);
    }
    catch(err) {
      logException('isTextMatched', err.message);
    }
    return false;
}

/*
  getTranslatedText: function to get the translated text based on translation mapping type
*/
function getTranslatedText(msgType, actualMsg, translatedMsg, currentMsg) {
  try {
    if(msgType !== 'message')
      return translatedMsg;
  	const msg_tokens = actualMsg.match(/&[A-Za-z0-9^_]+/g);
  	const msg_parts = actualMsg.split(/&[A-Za-z0-9^_]+/);
  	const msg_token_values = [];
    let trx_msg_txt = translatedMsg;
    msg_tokens.forEach((token, index) => {
    	const token_value = extractStringBetween(currentMsg, msg_parts[index], msg_parts[index+1]);
      msg_token_values.push(token_value);
    	trx_msg_txt = trx_msg_txt.replace(token, token_value);
    });
    return trx_msg_txt;
  }
  catch(err) {
    logException('getTranslatedText', err.message);
  }
  return currentMsg;
};

/*
  highlightElement: function to highlight the successfully translated and not successfully translated elements
*/
function highlightElement(element, translated) {
  try {
      if(g_debug && element && element !== 'undefined') {
        element.setAttribute('iTranslateAttempted', 'Y');
        if(translated) {
          element.style.border = g_translation_success;
        } else {
          element.style.border = g_translation_notfound;
        }
      }
  }
  catch(err) {
    logException('highlightElement', err.message);
  }
}

/*
  getTranslatedValue: function to retrieved translated value from store by mapping originalText, fromLanguage & toLanguage
*/
function getTranslatedValue(store, originalText, fromLanguage, toLanguage, element) {
  try {
      if(!originalText) {
        highlightElement(element, false);
        return originalText;
      }
      const translations = store.filter(item=> isTextMatched(item['type'], item[fromLanguage], originalText));
      if(translations && translations[0]) {
        const translatedText = getTranslatedText(translations[0]['type'], translations[0][fromLanguage], translations[0][toLanguage], originalText);
        highlightElement(element, true);
        return translatedText;
      }
      else if((originalText.match(/<script>/g) || []).length == 1) {
        const parts = originalText.split('<script>');
        return `${getTranslatedValue(store, parts[0], fromLanguage, toLanguage, element)}<script>${parts[1]}`;
      }
      else {
        highlightElement(element, false);
        return originalText;
      }
    }
    catch(err) {
      logException('getTranslatedValue', err.message);
    }
    highlightElement(element, false);
    return originalText;
}

/*
  getText: function to derive the text content of an html element
*/
function getText(element) {
  try {
    return element.innerText;
  }
  catch(err) {
    return element.innerHTML;
  }
}

/*
  translateElements: function to apply language translation on specified HTML DOM elements
*/
function translateElements(elements, store, fromLanguage, toLanguage) {
  try {
      elements.forEach((element, index) => {
        const currentHtml = element.innerHTML;
        const currentText = getText(element);
        let originalText;
        if(currentText) {
          originalText = currentText;
        }
        else {
          originalText = currentHtml;
        }
        const translatedText = getTranslatedValue(store, originalText.trim(), fromLanguage, toLanguage, element);
        if(currentHtml.includes(originalText.trim())) {
          element.innerHTML = currentHtml.replace(originalText.trim(), translatedText);
        }
        else {
          element.innerHTML = translatedText;
        }
      });
  }
  catch(err) {
    logException('translateElements', err.message);
  }
}

/*
  translateElementsByQuery: function to identify the HTML DOM elements from query & apply language translations
*/
function translateElementsByQuery(query, store, fromLanguage, toLanguage) {
  try {
      let elements = document.querySelectorAll(query);
      let eligibleElements = [];
      elements.forEach((element, index) => {
        if( getText(element) && getText(element).match(/.*[a-zA-Z]+.*/g) ) {
          element.setAttribute('iTranslateEligible', 'Y');
          eligibleElements.push(element);
        }
      });
      eligibleElements = eligibleElements.sort(function(a, b){return a.childElementCount - b.childElementCount});
      translateElements(eligibleElements, store, fromLanguage, toLanguage);
  }
  catch(err) {
    logException('translateElementsByQuery', err.message);
  }
}

/*
  iTranslateVariables: This is the function which will translate the text in variables like form validations
*/
function iTranslateVariables(store, fromLanguage, toLanguage) {
  try {
      if(typeof _DefaultFormName_Formats !== 'undefined' && Array.isArray(_DefaultFormName_Formats)) {_DefaultFormName_Formats.forEach((item, index) => _DefaultFormName_Formats[index]=getTranslatedValue(store, item, fromLanguage, toLanguage, 'undefined'))}
      if(typeof _DefaultFormName_Labels !== 'undefined' && typeof _DefaultFormName_Labels === 'object') {
        for (var key in _DefaultFormName_Labels) {
          if (_DefaultFormName_Labels.hasOwnProperty(key)) {
            var val = _DefaultFormName_Labels[key];
            _DefaultFormName_Labels[key] = getTranslatedValue(store, _DefaultFormName_Labels[key], fromLanguage, toLanguage, 'undefined');
          }
        }
      }
  }
  catch(err) {
    logException('iTranslateVariables', err.message);
  }
}

/*
  iTranslateInputTitles: This is the function which will translate the titles on textinputs and textareas on which we have form validations
*/
function iTranslateInputTitles(store, fromLanguage, toLanguage) {
  try {
      let elements = document.querySelectorAll('input, textarea');
      elements.forEach((element, index) => {
        if(element && element.title) {
          element.title = getTranslatedValue(store, element.title, fromLanguage, toLanguage, 'undefined')
        }
      });
  }
  catch(err) {
    logException('iTranslateInputTitles', err.message);
  }
}

/*
  alterJSFunction: This is the function which alters a given javascript function dynamically
*/
function alterJSFunction(fn_str, to_add_txt) {
  let _fn_str = fn_str;
  const _fn_params = _fn_str.substring(_fn_str.indexOf("(")+1, _fn_str.indexOf(")"));

  _fn_str = _fn_str.slice(_fn_str.indexOf("{") + 1, _fn_str.lastIndexOf("}"));
  _fn_str = _fn_str.replace( _fn_str,to_add_txt+_fn_str)

  const _fn = new Function(_fn_params, _fn_str);
  return _fn;
}


/*
  enableReTranslate: This is the function which enables retranslate on elements defined by g_enable_retranslate_on
*/
function enableReTranslate() {
  try {
    const elements = document.querySelectorAll(g_enable_retranslate_on);
    elements.forEach((element, index) => {
      if(element.onclick) {
        element.onclick = alterJSFunction(element.onclick.toString(), ";setTimeout( function() { iTranslate(g_query,g_translations,'english',g_current_language); enableReTranslate(); }, 3000);");
      }
      if(element.onchange) {
        element.onchange = alterJSFunction(element.onchange.toString(), ";setTimeout( function() { iTranslate(g_query,g_translations,'english',g_current_language); enableReTranslate(); }, 3000);");
      }
    });
  }
  catch(err) {
    logException('enableReTranslate', err.message);
  }
}

/*
  iTranslate: This is the master function which wraps the translation logic
*/
function iTranslate(query, store, fromLanguage, toLanguage) {
  try {
      translateElementsByQuery(query, store, fromLanguage, toLanguage);
      iTranslateVariables(store, fromLanguage, toLanguage);
      iTranslateInputTitles(store, fromLanguage, toLanguage);
      g_current_language = toLanguage;

      enableReTranslate();
  }
  catch(err) {
    logException('iTranslate', err.message);
  }
}

/*
  changeLanguage: This function is invoked whenever the language Selection dropdown value is changed
*/
function changeLanguage({value, options, selectedIndex}) {
  try {
    const selectedLanguage = (value || options[selectedIndex].value);
    saveUserPreferredLanguage(selectedLanguage);
    iTranslate(g_query, g_translations, g_current_language, selectedLanguage);
  }
  catch(err) {
    logException('changeLanguage', err.message);
  }
}

/*
  addLanguageSelector: This function that removes the language selection dropdown from the Page
*/
function removeLanguageSelector() {
  try {
    const languageSelector = document.querySelector('#iLanguageSelector');
    if(languageSelector) {
      languageSelector.parentNode.removeChild(languageSelector);
    }
  }
  catch(err) {
    logException('removeLanguageSelector', err.message);
  }
}

/*
  buildLanguageSelector: This function builds the language selection dropdown
*/
function buildLanguageSelector(languageMenu) {

  try {

    if(getUserPreferredLanguage()) {
      g_current_language = getUserPreferredLanguage();
    }

    removeLanguageSelector();

    languageMenu.innerHTML = '<select id="iLanguageSelector" onchange="changeLanguage(this)"></select>';

    const languageSelector = document.getElementById("iLanguageSelector");

    g_supported_languages.forEach(({languageDescription, languageCode}, index) => {
        const option = document.createElement("option");
        option.innerHTML = languageDescription;
        option.value = languageCode;
        languageSelector.options.add(option);
        if(option.value === g_current_language) {
          languageSelector.options[index].selected = true;
        }
    });

  }
  catch(err) {
    logException('buildLanguageSelector', err.message);
  }

}

/*
  addLanguageSelector: This function adds the language selection dropdown based on query defined in g_add_language_selector_on
*/
function addLanguageSelector() {

  try {

      // Below is css query to get handle to the navigation bar where the language selector needs to be hooked to
      const navigationBar = document.querySelector(g_add_language_selector_on);
      if(navigationBar.tagName === 'TR') {
        const menuitems = navigationBar.getElementsByTagName('td');
        const spacerItem = navigationBar.insertCell(menuitems.length-1);
        const languageMenu = navigationBar.insertCell(menuitems.length);
        spacerItem.innerHTML   =  g_spacer_html;
        buildLanguageSelector(languageMenu);
      }
      else {
        const languageMenu = document.createElement('span');
        languageMenu.style = g_language_selector_style;
        navigationBar.appendChild(languageMenu);
        buildLanguageSelector(languageMenu);
      }

      if(g_current_language !== 'english') {
        iTranslate(g_query, g_translations, 'english', g_current_language);
      }

  }
  catch(err) {
    logException('addLanguageSelector', err.message);
  }
}

/*
  isEmptyOrUndefined: This function returns true if the param value if empty or undefined else it returns false
*/
function isEmptyOrUndefined(param) {
  try {
    if(!param|| param === 'undefined' || param === 'null' || param === '') {
      return true;
    }
    else {
      return false;
    }
  }
  catch(err) {
    logException('isEmptyOrUndefined', err.message);
  }
  return true;
}

/*
  nvl: This function returns overrideValue if its not null or empty, else it returns value in config file
*/
function nvl(value1, value2) {
  try {
    if( !isEmptyOrUndefined(value1) ) {
      return value1;
    }
  }
  catch(err) {
    logException('nvl', err.message);
  }
  return value2;
}

/*
  initITranslate: This function that initializes and hooks up iTranslate to the page implementing it
*/
function initITranslate(iTranslateConfig, iTranslateDefaultLanguage, iTranslateDebugMode, iTranslateQuery, iTranslateStore) {

  try {

        /* Loading iTranslate Configs - The config file would be implemted by the module which gets onboarded to iTranslate*/
        getjson(iTranslateConfig, 'GET').then(function(config) {
          g_supported_languages = config['languages'];
          g_add_language_selector_on = config['enableLanguageSelectorOn'];
          g_language_selector_style = config['languageSelectorStyle'];
          g_enable_retranslate_on = config['enableRetranslateOn'];
          g_spacer_html = nvl(config['spacer'], g_spacer_html);
          setCurrentLanguage(nvl(iTranslateDefaultLanguage, config['defaultLanguage']));
          setDebugMode(nvl(iTranslateDebugMode, config['debugMode']));

          g_query  = nvl(iTranslateQuery, config['query']);
          let translationStore = nvl(iTranslateStore, config['translateStore']);
          getjson(translationStore, 'GET').then(function(store) {
            g_translations = store.translations;
            addLanguageSelector();
          });
        });
    }
    catch(err) {
      logException('initITranslate', err.message);
    }

}
