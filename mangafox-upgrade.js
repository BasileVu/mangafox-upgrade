/* jshint -W097 */
'use strict';

// We check that the code is not run inside a frame
if (window.top === window.self) {

/********
** CSS **
********/

var css = `
/* The following is the css for Mangafox-Upgrade */

.noselect {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

#mu-menu {
	position: fixed;
	z-index: 999;
	width: 279px;
	height: 300px;
	top: 0;
	right: 0;
}

.mu-menu-hide {
	right: -252px !important;
}

#mu-menu-deployer {
	position: absolute;
	width: 25px;
	height: 25px;
	top: 0;
	left: 0;
	background-image: url("http://mangafox.me/favicon.ico");
	background-repeat: no-repeat;
	background-size: 25px 25px;
	border: solid #717D8C 1px;
	cursor: pointer;
	text-align: center;
	color: #717D8C;
	font-weight: bolder;
	font-family: Arial, sans-serif;
	font-size: 15px;
	line-height: 170%;
}

#mu-menu-deployer:hover {
	border-color: #8AE305;
	color: #8AE305;
}

#mu-menu-content {
	position: absolute;
	top: 0;
	right: 0;
	width: 250px;
	height: 300px;
	background-color: #DDDDDD;
	border: solid #717D8C 2px;
	border-right: none;
}

#mu-tabs-menu {
	list-style: none;
	margin-top: 2px;
	height: 25px;
}

.mu-tab {
	float: left;
	width: 80px;
	background-color: #666666;
	margin-left: 2px;
	font-family: Arial, Helvetica, sans-serif;
	color: white;
	line-height: 250%;
	text-align: initial;
	padding-left: 5px;
	-webkit-box-sizing: border-box;
	-moz-box-sizing: border-box;
	box-sizing: border-box;
	cursor: pointer;
}

.mu-tab:hover {
	text-decoration: underline;
}

.mu-tab-selected {
	height: 32px;
	font-weight: bold;
}

.mu-tab-content {
	display: none;
	margin-top: 7px;
	margin-left: 2px;
	width: 242px;
	height: 248px;
	border: solid #666666 1px;
	text-align: initial;
}

.mu-tab-content-display {
	display: block;
}

.mu-options {
	margin-top: 7px;
	margin-left: 3px;
}

.mu-options tr:not(:last-child) td {
	padding-bottom: 5px;
}

.mu-option-checkbox {
	line-height: 15px;
	width: 15px;
}

.mu-option-checkbox div {
	border: solid #777777 1px;
	width: 15px;
	height: 15px;
	vertical-align: center;
	cursor: pointer;
}

.mu-option-checkbox div.checked {
	background-color: #ABBD00;
}

.mu-option-checkbox div:hover {
	border-style: outset;
}

.mu-option-checkbox div:active {
	border-style: inset;
}

.mu-option-description {
	padding-left: 3px;
	font-family: Arial, sans-serif;
	line-height: 13px;
}

#mu-menu-credits {
	text-align: center;
	font-size: 0.8em;
	line-height: 1.7em;
}

#mu-menu-credits a {
	font-size: 1em !important;
}

.mu-update-color {
	background-color: #DAF0D3 !important;
}

#mu-last-pages-visited > img {
	width: 10px;
	cursor: pointer;
}

.mu-greyed {
	opacity: 0.4;
    filter: alpha(opacity=40);
	cursor: default !important;
}

#mu-bookmark-page-button {
	position: fixed;
	bottom: 0;
	right: 0;
	background-color: white;
	
	font-size: 10px;
	
	border: 1px solid grey;
	border-radius: 3px;
	
	cursor: pointer;
}

`;



/*****************
** LocalStorage **
******************/

// localStorage prefix to avoid conflict if site uses locastorage as well
var lsPrefix = "mangafox-upgrade-userscript-";
var numBlankPagesCorrectedKey = lsPrefix + "num-blankpages-corrected";
var showMenuKey = lsPrefix + "show-menu";
var lastPagesVisitedKey = lsPrefix + "last-pages-visited"

var options = {
	upgrade: {
		leftBookmark: {
			description: "Move bookmarks tab to the right.",
			value: lsPrefix + "left-bookmark"
		},
		autoEnlarge: {
			description: "Automatically enlarge big images.",
			value: lsPrefix + "auto-enlarge"
		},
		preloadNext: {
			description: "Preload next image.",
			value: lsPrefix + "preload-next"
		},
		highlightUpdate: {
			description: "Highlight unvisited updates.",
			value: lsPrefix + "hightlight-update"
		}
	},
	bug: {
		blankPage: {
			description: "Load mangafox blank pages.",
			value: lsPrefix + "blank-page"
		},
		nextPage: {
			description: "Re-enable next page change on big images.",
			value: lsPrefix + "next-page"
		}
	}
};



/*********
** Load **
*********/

// Done at start

if (getLSValue(options.upgrade.leftBookmark.value) != 0) {
	$(document).bind("DOMSubtreeModified", swapACG);
}

// Done when DOM ready
$(document).ready(function () {
	
	console.log("Mangafox upgrade successfully loaded.");
	
	// All
	
	if (getLSValue(options.bug.blankPage.value) != 0) {
		loadBlankPage();
	}
	
	// Menu
	addCss(css, createMuMenu);
	
	if (getLSValue(options.upgrade.leftBookmark.value) != 0) {
		$(document).unbind("DOMSubtreeModified", swapACG);
	}
	
	// Bookmarks
	if (getLSValue(options.upgrade.highlightUpdate.value) != 0) {
		// This is here because mangafox do not update the visit unless you go to the manga's main page.
		if (loadManga()) {
			updateVisit();
		}
		highlightUpdate();
	}
	
	if (isBookmarkUrl()) {
		lastPagesInBookmark();
	}

	// Reading

	// Check if this is a chapter page
	if (isChapterUrl()) {

		// enlarge big images and big images fix
		if (getLSValue(options.upgrade.autoEnlarge.value) != 0) {
			enlargeOnlyBigImages();			
		} else if (getLSValue(options.bug.nextPage.value) != 0) {
			// keep native enlarge but remove it after one click (after big images are enlarged)
			$('.read_img').click(function () {
				$('.read_img a').attr('onclick', '');
			});
		}
		
		// store this page in the localStorage according to the manga name
		// storeCurrentPageInfos();
		addBookmarkButton();
	}
});

// Done when everything ready
$(window).load(function () {
	if (isChapterUrl() && getLSValue(options.upgrade.preloadNext.value) != 0) {
		preloadNext();
	}
});


/**************
** Functions **
**************/

// Add css style in the head
function addCss(css, callback) {
	var style = $('head #mu-css');

	// If the css does not exist, we create and add it
	if (!style.length) {
		style = $('<style></style>')
		.attr('type', "text/css")
		.attr('id', "mu-css")
		.text(css);

		$('head').append(style);
	} else {
		// Otherwise we add the new css at the end
		style.text(style.text() + css);
	}
	callback();
}

// Adds the button bookmark on reading pages.
function addBookmarkButton() {
	var button = $('<div></div>')
				.attr('id', 'mu-bookmark-page-button')
				.attr('title', 'Save this page as last page visited for this manga')
				.text('Bookmark');
	
	// action for button
	button.click(function () {
		var curPage = tokenizeUrl();
		var lpv = loadLPVFromLS();

		// if bookmarked
		if (JSON.stringify(curPage) === JSON.stringify(lpv[curPage.mangaName])) {
			delete lpv[curPage.mangaName];
			$(this).text('Bookmark');
		} else {
			lpv[curPage.mangaName] = curPage;
			$(this).text('Bookmarked');
		}
		localStorage.setItem(lastPagesVisitedKey, JSON.stringify(lpv));
	});
				 
	if (isPageLPV()) {
		button.text('Bookmarked');
	}
	
	$('body').append(button);
}

// Determines if the current page is the last page visited stored.
function isPageLPV() {
	var curPage = tokenizeUrl();
	var lpv = loadLPVFromLS();
	return JSON.stringify(curPage) === JSON.stringify(lpv[curPage.mangaName]);
}

/**
* Loads the object representing the last pages visited stored in the localStorage.
* Returns the object at the last page visited key, else an empty object.
*/
function loadLPVFromLS() {
	var lpv = localStorage.getItem(lastPagesVisitedKey);
	if (lpv === null) {
		lpv = {};
	} else {
		lpv = JSON.parse(lpv);
	}
	return lpv;
}

// Displays the last page visited for each manga in the bookmarks.
function lastPagesInBookmark() {
	
	var lpv = loadLPVFromLS();
	
	$('.series_grp .title .noexpand').each(function () {
		
		var lpvImg = $('<img src="http://mangafox.me/favicon.ico">');
					
		var mangaUrl = $(this).next().attr('href');
		var mangaName = mangaUrl.match(/^http:\/\/mangafox\.me\/manga\/(.+)\/$/)[1];
		
		// default values
		var text = "Not read yet";
		var urlLPV = mangaUrl;
		
		// manga found in localStorage
		if (lpv[mangaName] !== undefined) {
			
			var lpvForManga = lpv[mangaName];
			
			var prefix = "http://mangafox.me/manga";
			var volume = lpvForManga.volumeNumber !== null ? "v" + lpvForManga.volumeNumber : "";
			var chapter = "c" + lpvForManga.chapterNumber;
			var page = lpvForManga.pageNumber + ".html";
			
			// change hover text and allows to go to lpv by clicking on image
			text = (volume !== "" ? volume + " " : "") + chapter + " page " + lpvForManga.pageNumber;
			urlLPV = prefix + "/" + mangaName + "/" + volume + "/" + chapter + "/" + page;
			
			lpvImg.click(function () {
				window.location.href = urlLPV;
			});
			
		} else { // else button greyed out
			lpvImg.addClass('mu-greyed');
		}
		
		// The 'button' (image) to click to go to last page visited
		var muLPV = $('<span></span>')
					.attr('id', 'mu-last-pages-visited')
					.attr('title', 'Last page visited : ' + text)
					.append(lpvImg);
					
		$(this).after(muLPV);
	});
}

// Stores in the localStorage the url of the current page accordingly to the manga name.
function storeCurrentPageInfos() {
	var tokens = tokenizeUrl();
	
	if (tokens === null){
		return;
	}
	
	// add current page url to localStorage
	var lastPagesVisited = loadLPVFromLS();
	lastPagesVisited[tokens.mangaName] = tokens;
	localStorage.setItem(lastPagesVisitedKey, JSON.stringify(lastPagesVisited));
}

// Checks if webpage is a bookmark page
function isBookmarkUrl() {
	return window.location.href.match(/^http:\/\/mangafox\.me\/bookmark\//) !== null;
}

// Checks if webpage is a chapter's page
function isChapterUrl() {
	var chRegExp = /\/c\d+\/\d+.html$/i;
	return chRegExp.test(window.location.pathname);
}

/** 
* Gets the different infos from url.
* Returns :
* - null if not a chapter url
* - the current url, name of the manga, volume number, chapter number and page number otherwise.
*   The volume number is 'null' if the manga does not have volumes.
*/
function tokenizeUrl() {
	if (!isChapterUrl()) {
		return null;
	}
	
	var curPageUrl = window.location.href;
	var values = curPageUrl.match(/^http:\/\/mangafox\.me\/manga\/(\w+)(?:\/v(\w+))?\/c(\w+)\/([0-9]+).html$/);
	
	var tokens = {};
	tokens.mangaName = values[1];
	tokens.volumeNumber = values[2] === undefined ? null : values[2];
	tokens.chapterNumber = values[3];
	tokens.pageNumber = values[4];
	
	return tokens;
}

// Check if the user just went to a manga chapter
function loadManga() {
	// If there is no referrer it is probably a refresh
	if (document.referrer == "") {
		return false;
	}

	// We check that the current webpage is a chapter page and check if the previous page
	// was from the same chapter/manga
	var curRegExp = /\/manga\/(\w+)\/.*\.html/i;
	var prevRegExp = /\/manga\/(\w+)/i;
	var current = curRegExp.exec(window.location.pathname);
	var previous = prevRegExp.exec(document.referrer);

	// If the current page is a chapter page and the previous page isn't or is not about
	// the same manga, we return true
	return (current !== null && (previous === null || current[1] !== previous[1]));
}

function updateVisit() {
	// We get the path up to the manga name then ask for this page so mangafox update our visit
	$.get(window.location.pathname.split('/').slice(0, 3).join('/'));
}

// Return the value of the localstorage at key 'key'.
function getLSValue(key) {
	var val = localStorage.getItem(key);
	return (val === null ? 0 : val);
}

// Sum a number 'toAdd' with an already existant number in the localStorage at key 'key'.
function sumLSValue(key, toAdd) {
	var valInLS = localStorage.getItem(key);
	localStorage.setItem(key, toAdd + (valInLS === null ? 0 : valInLS));
}

// Increments a value in the localStorage at key 'key'.
function incrLSValue(key) {
	sumLSValue(key, 1);
}

// Toggle the value in the localStorage at key 'key'.
function toggleLSValue(key) {
	var val = localStorage.getItem(key);
	localStorage.setItem(key, (val == 0 || val === null ? 1 : 0));
}

// Swaps ACG and Bookmarks in the menu.
function swapACG() {
	var last = $('#menu li').last();
	
	if (last.text() === "ACG Topics") {
		var bookmark = last.prev();
		
		last.removeClass('right');
		bookmark.addClass('right');
		
		last.insertBefore(bookmark);
	}
}

// Loads page via ajax if the body tag is empty.
function loadBlankPage() {
	if ($('body').is(':empty')) {
		$.get(window.location.href, function (res) {
			document.write(res);
			
			incrLSValue(numBlankPagesCorrectedKey);
		});
	}
}

// Enlarges the current image to fill the viewport.
function enlargeImage(width) {
	var viewerWidth = width + 12;
	
	if ($(window).width() > viewerWidth) {
		$('#viewer').css('width', width + 12 + 'px');
		$('.read_img img').css('width', width + 'px');
	} else {
		$('#viewer').css('width', '98vw');
		$('.read_img img').css('width', '95vw');
	}
}

// Automatically enlarges big images.
function enlargeOnlyBigImages() {
	// We get the width and height of the image from the script
	var regExp = /image_width *= *(\d+);.*image_height *= *(\d+);/gi;
	var match = regExp.exec($('#footer ~ script').eq(0).html().replace(/(\r\n|\n|\r)/gm,""));
	var width = match !== null ? parseInt(match[1]) : null;
	var height = match !== null ? parseInt(match[2]) : null;
	
	if (width > height) {
		enlargeImage(width);
	}
}

// Preloads next image by putting it in the cache.
function preloadNext() {
	
	// pages
	var pageList = $('.l').first();
	var dropDown = pageList.children()[0];
	var currentPage = dropDown.options[dropDown.selectedIndex].text;
	var totalPages = pageList.text().match(/of (\d+)/i)[1];
	
	// chapter
	var chapterList = $('#top_chapter_list')[0];
	var nextChapter = "";
	// We check that there is a next chapter available
	if (chapterList.selectedIndex + 1 < chapterList.options.length) {
		nextChapter = chapterList.options[chapterList.selectedIndex + 1].value;
	}

	// If this is the last page and there is no next chapter, we exit the function
	if (nextChapter === "" && currentPage == totalPages) {
		return;
	}
	
	// next page href
	var mangaPath = document.location.href.match(/^(http:\/\/mangafox\.me\/manga\/\w+\/)/i)[1];
	var nextChaptFirstHref = mangaPath + nextChapter + "/1.html";
	var nextPageHref = (currentPage != totalPages ? $('.read_img a').attr('href') : nextChaptFirstHref);
	
	// load next image
	$.get(nextPageHref, function (nextPageHTML) {
		var imgPath = nextPageHTML.match(/[.\s]+<div class="read_img">.+\s+<img src="([^"]+)"/)[1];
		
		// since the cdn doesn't allow us to get img, we preload it by putting it directly hidden in body
		$('body').append('<img id="mu-preload-img" src="' + imgPath + '">');
		$('#mu-preload-img').hide();
	});
}

// Hightlight bookmarks if last visit is older than last update
function highlightUpdate() {
	var bookmarks = $('ul#bmlist li div.series_grp');

	// If there is no bookmarks, we exit the function
	if (!bookmarks.length) {
		return ;
	}

	bookmarks.each(function() {
		var lastUpdateRaw = $(this).find('dl dt em span.timing');
		var lastVisitRaw = $(this).find('h2 em span.timing');

		// If one of the information is missing, we skip this bookmark
		if (!lastUpdateRaw.length || !lastVisitRaw.length) {
			return ;
		}

		var lastUpdate = convertToTime(lastUpdateRaw.text());
		var lastVisit = convertToTime(lastVisitRaw.text());

		if (lastUpdate > lastVisit) {
			$(this).addClass('mu-update-color');
		}
	});
}

// Convert mangafox bookmarks date to time
function convertToTime(date)
{
	var regExpDate = /(Today|Yesterday|(\w+)\s(\d+),\s(\d+))\s(\d+):(\d+)(am|pm)/i;
	var time = regExpDate.exec(date);

	var result;
	if (time[1] == 'Today' || time[1] == 'Yesterday') {
		result = new Date();
		if (time[1] == 'Yesterday') {
			result.setDate(result.getDate() - 1);
		}
	} else {
		result = new Date(time[2] + ' ' + time[3] + ', ' + time[4]);
	}
	var diff = (time[7] == 'am' ? 0 : 12);
	result.setHours(parseInt(time[5]) + diff);
	result.setMinutes(parseInt(time[6]));
	result.setSeconds(0);

	return result;
}

/*********
** Menu **
*********/

// Create the menu for Mangafox-Upgrade
function createMuMenu() {
	var menu = $('<div></div>').attr('id', "mu-menu");
	var deployer = $('<div>-</div>').attr('id', "mu-menu-deployer");
	var content = $('<div></div>').attr('id', "mu-menu-content");
	var tabsMenu = $('<ul></ul>').attr('id', "mu-tabs-menu");
	var tabs = [
		$('<li class="mu-tab">Upgrades</li>'),
		$('<li class="mu-tab">Bug Fixes</li>'),
		$('<li class="mu-tab">Stats</li>') ];
	var tabsContent = [
		$('<div id="mu-upgrade-tab" class="mu-tab-content"></div>'),
		$('<div id="mu-bug-tab" class="mu-tab-content"></div>'),
		$('<div id="mu-stat-tab" class="mu-tab-content"></div>') ];
	var credit = $('<p id="mu-menu-credits"><a href="https://github.com/Flagoul/mangafox-upgrade" target="_blank">Mangafox-Upgrade</a> @ 2015</p>');

	// Hides the menu depending on last access
	if (getLSValue(showMenuKey) == 0) {
		menu.addClass('mu-menu-hide');
		deployer.text('+');
	}

	// Set the default tab selected
	tabs[0].addClass('mu-tab-selected');
	tabsContent[0].addClass('mu-tab-content-display');

	/* Events */

	$.each(tabs, function(index, value) {
		value.click(function(e) {
			$('.mu-tab').removeClass('mu-tab-selected');
			$('.mu-tab-content').removeClass('mu-tab-content-display');

			$(this).addClass('mu-tab-selected');
			$('.mu-tab-content').eq(index).addClass('mu-tab-content-display');
		});
		tabsMenu.append(value);
	});

	// Show/hide menu when deployer is clicked
	deployer.click(function() {
		$(this).parent().toggleClass('mu-menu-hide');
		toggleLSValue(showMenuKey);
		if ($(this).parent().hasClass('mu-menu-hide')) {
			$(this).text('+');
		} else {
			$(this).text('-');
		}
	});

	/* Creation */

	optionsTab(tabsContent[0], 'upgrade');
	optionsTab(tabsContent[1], 'bug');

	content.append(tabsMenu);
	$.each(tabsContent, function(index, value) {
		content.append(value);
	});
	content.append(credit);
	menu.append(deployer);
	menu.append(content);
	$('body').append(menu);
}

// Create an options tab. Take the tab Object and the name of the index in the options variable
function optionsTab(tab, name) {
	var op = $('<table></table>').addClass("mu-options");
	var content = $('<tbody></tbody>');

	$.each(options[name], function(index, value) {
		var newOption = $('<tr></tr>');
		var checkBoxCell = $('<td></td>').addClass('mu-option-checkbox').addClass('noselect');
		var checkBox = $('<div></div>');
		var desc = $('<td>' + value.description + '</td>').addClass('mu-option-description');

		if (getLSValue(value.value) != 0) {
			checkBox.addClass('checked');
		}

		checkBox.click(function() {
			$(this).toggleClass('checked');
			toggleLSValue(value.value);
		});

		checkBoxCell.append(checkBox);
		newOption.append(checkBoxCell).append(desc);
		content.append(newOption);
	});

	op.append(content);
	tab.append(op);
}

} // end [if not in frame]