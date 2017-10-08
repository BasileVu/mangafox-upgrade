// ==UserScript==
// @name         Mangafox upgrade
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Improve user experience while browsing mangafox.me pages (preloading, auto-resize big image, etc).
// @author       Flagoul && Gerardufoin
// @match        https://mangafox.me/*
// @grant        none
// @run-at       document-start
// @require      https://code.jquery.com/jquery-2.1.4.min.js
// ==/UserScript==

/* jshint -W097 */
'use strict';

/********
 ** CSS **
 ********/

const css = `
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
    background-image: url("https://mangafox.me/favicon.ico");
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
const lsPrefix = "mangafox-upgrade-userscript-";
const numBlankPagesCorrectedKey = lsPrefix + "num-blankpages-corrected";
const showMenuKey = lsPrefix + "show-menu";
const lastPagesVisitedKey = lsPrefix + "last-pages-visited";

const options = {
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
        },
        lpvSaved: {
            description: "Save last pages visited (seen in bookmarks).",
            value: lsPrefix + "lpv-saved"
        },
        lpvSavedManual: {
            description: "Save last pages visited manually.",
            value: lsPrefix + "lpv-saved-manual"
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

// We check that the code is not run inside a frame
if (window.top === window.self) {

    // Done when the menu is loaded
    $('#menu').ready(() => {
        if (getLSNum(options.upgrade.leftBookmark.value) !== 0) {
            swapBookmark();
        }
    });

    // Done when DOM ready
    $(document).ready(() => {

        console.log("Mangafox upgrade successfully loaded.");

        // All

        if (getLSNum(options.bug.blankPage.value) !== 0) {
            loadBlankPage();
        }

        // Menu
        addCss(css, createMuMenu);


        // Bookmarks

        if (getLSNum(options.upgrade.highlightUpdate.value) !== 0) {
            // This is here because mangafox do not update the visit unless you go to the manga's main page.
            if (loadManga()) {
                updateVisit();
            }
            highlightUpdate();
        }

        // last pages visited button
        if (isBookmarkUrl()) {
            if (getLSNum(options.upgrade.lpvSaved.value) !== 0) {
                lastPagesInBookmark();
            }
        }


        // Reading

        // Check if this is a chapter page
        if (isChapterUrl()) {

            // enlarge big images and big images fix
            if (getLSNum(options.upgrade.autoEnlarge.value) !== 0) {
                enlargeOnlyBigImages();
            } else if (getLSNum(options.bug.nextPage.value) !== 0) {
                // keep native enlarge but remove it after one click (after big images are enlarged)
                $('.read_img').click(() => {
                    $('.read_img a').attr('onclick', '');
                });
            }

            // store this page in the localStorage according to the manga name
            if (getLSNum(options.upgrade.lpvSaved.value) !== 0) {
                if (getLSNum(options.upgrade.lpvSavedManual.value) !== 0) {
                    addBookmarkButton();
                } else {
                    storeCurrentPageInfos();
                }
            }
        }
    });

    // Done when everything ready
    $(window).load(() => {
        if (isChapterUrl() && getLSNum(options.upgrade.preloadNext.value) !== 0) {
            preloadNext();
        }
    });

} // end [if not in frame]


/**************
 ** Functions **
 **************/

// Add css style in the head
function addCss(css, callback) {
    let style = $('head #mu-css');

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
    const button = $('<div></div>')
        .attr('id', 'mu-bookmark-page-button')
        .attr('title', 'Save this page as last page visited for this manga')
        .text('Bookmark');

    // action for button
    button.click((e) => {
        const curPage = tokenizeUrl();
        const lpv = loadLPVFromLS();

        // if bookmarked
        if (JSON.stringify(curPage) === JSON.stringify(lpv[curPage.mangaName])) {
            delete lpv[curPage.mangaName];
            $(e.currentTarget).text('Bookmark');
        } else {
            lpv[curPage.mangaName] = curPage;
            $(e.currentTarget).text('Bookmarked');
        }
        setLSVal(lastPagesVisitedKey, JSON.stringify(lpv));
    });

    if (isPageLPV()) {
        button.text('Bookmarked');
    }

    $('body').append(button);
}

// Determines if the current page is the last page visited stored.
function isPageLPV() {
    const curPage = tokenizeUrl();
    const lpv = loadLPVFromLS();
    return JSON.stringify(curPage) === JSON.stringify(lpv[curPage.mangaName]);
}

/**
 * Loads the object representing the last pages visited stored in the localStorage.
 * Returns the object at the last page visited key, else an empty object.
 */
function loadLPVFromLS() {
    let lpv = getLSVal(lastPagesVisitedKey);
    if (lpv === null) {
        lpv = {};
    } else {
        lpv = JSON.parse(lpv);
    }
    return lpv;
}

// Displays the last page visited for each manga in the bookmarks.
function lastPagesInBookmark() {

    const lpv = loadLPVFromLS();

    $('.series_grp .title .noexpand').map((i, el) => {

        const lpvImg = $('<img src="https://mangafox.me/favicon.ico">');

        const mangaUrl = $(el).next().attr('href');
        const mangaName = mangaUrl.match(/^\/\/mangafox\.me\/manga\/(.+)\/$/)[1];

        // default values
        let text = "Not read yet";
        let urlLPV = mangaUrl;

        // manga found in localStorage
        if (lpv[mangaName] !== undefined) {

            const lpvForManga = lpv[mangaName];

            const prefix = "https://mangafox.me/manga";
            const volume = lpvForManga.volumeNumber !== null ? "v" + lpvForManga.volumeNumber : "";
            const chapter = "c" + lpvForManga.chapterNumber;
            const page = lpvForManga.pageNumber + ".html";

            // change hover text and allows to go to lpv by clicking on image
            text = (volume !== "" ? volume + " " : "") + chapter + " page " + lpvForManga.pageNumber;
            urlLPV = prefix + "/" + mangaName + "/" + (volume !== "" ? volume + "/" : "") + chapter + "/" + page;

            lpvImg.click(() => {
                window.location.href = urlLPV;
            });

        } else { // else button greyed out
            lpvImg.addClass('mu-greyed');
        }

        // The 'button' (image) to click to go to last page visited
        const muLPV = $('<span></span>')
            .attr('id', 'mu-last-pages-visited')
            .attr('title', 'Last page visited : ' + text)
            .append(lpvImg);

        $(el).after(muLPV);
    });
}

// Stores in the localStorage the url of the current page accordingly to the manga name.
function storeCurrentPageInfos() {
    const tokens = tokenizeUrl();

    if (tokens === null){
        return;
    }

    // add current page url to localStorage
    const lastPagesVisited = loadLPVFromLS();
    lastPagesVisited[tokens.mangaName] = tokens;
    setLSVal(lastPagesVisitedKey, JSON.stringify(lastPagesVisited));
}

// Checks if webpage is a bookmark page
function isBookmarkUrl() {
    return window.location.href.match(/^https:\/\/mangafox\.me\/bookmark\//) !== null;
}

// Checks if webpage is a chapter's page
function isChapterUrl() {
    const chRegExp = /\/c[^\/]+\/\d+.html$/i;
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

    const values = window.location.pathname.match(/manga\/([^\/]+)(?:\/v(\w+))*\/c([^\/]+)\/([0-9]+).html$/);

    const tokens = {};
    tokens.mangaName = values[1];
    tokens.volumeNumber = values[2] === undefined ? null : values[2];
    tokens.chapterNumber = values[3];
    tokens.pageNumber = values[4];

    return tokens;
}

// Check if the user just went to a manga chapter
function loadManga() {
    // If there is no referrer it is probably a refresh
    if (document.referrer === "") {
        return false;
    }

    // We check that the current webpage is a chapter page and check if the previous page
    // was from the same chapter/manga
    const curRegExp = /\/manga\/(\w+)\/.*\.html/i;
    const prevRegExp = /\/manga\/(\w+)/i;
    const current = curRegExp.exec(window.location.pathname);
    const previous = prevRegExp.exec(document.referrer);

    // If the current page is a chapter page and the previous page isn't or is not about
    // the same manga, we return true
    return (current !== null && (previous === null || current[1] !== previous[1]));
}

function updateVisit() {
    // We get the path up to the manga name then ask for this page so mangafox update our visit
    $.get(window.location.pathname.split('/').slice(0, 3).join('/'));
}

// Shorter than localStorage.getItem
function getLSVal(key) {
    return localStorage.getItem(key);
}

// Shorter than localStorage.setItem
function setLSVal(key, val) {
    localStorage.setItem(key, val);
}

// Return the numeric value of the localstorage at key 'key'.
function getLSNum(key) {
    const val = getLSVal(key);
    return (val === null ? 0 : Number(val));
}

// Sum a number 'toAdd' with an already existant number in the localStorage at key 'key'.
function sumLSValue(key, toAdd) {
    const num = getLSNum(key);
    setLSVal(key, toAdd + num);
}

// Increments a value in the localStorage at key 'key'.
function incrLSValue(key) {
    sumLSValue(key, 1);
}

// Toggle the numeric value in the localStorage at key 'key'.
function toggleLSValue(key) {
    const val = getLSNum(key);
    setLSVal(key, (val === 0 ? 1 : 0));
}

// Place the Bookmark link in the menu on the right.
function swapBookmark() {
    const menu = $('#menu').find('li');

    if (menu.last().text() !== "Bookmark") {
        menu.last().removeClass('right');

        for (let i = 0; i < menu.length; ++i) {
            if (menu.eq(i).text() === "Bookmark") {
                menu.eq(i).addClass('right');
                menu.eq(i).insertAfter(menu.last());
                return;
            }
        }
    }
}

// Loads page via ajax if the body tag is empty.
function loadBlankPage() {
    if ($('body').is(':empty')) {
        $.get(window.location.href, (res) => {
            document.write(res);

            incrLSValue(numBlankPagesCorrectedKey);
        });
    }
}

// Enlarges the current image to fill the viewport.
function enlargeImage(width) {
    const viewerWidth = width + 12;

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
    const regExp = /image_width *= *(\d+);.*image_height *= *(\d+);/gi;
    const match = regExp.exec($('#footer').find('~ script').eq(0).html().replace(/(\r\n|\n|\r)/gm, ""));
    const width = match !== null ? parseInt(match[1]) : null;
    const height = match !== null ? parseInt(match[2]) : null;

    if (width > height) {
        enlargeImage(width);
    }
}

// Preloads next image by putting it in the cache.
function preloadNext() {

    // pages
    const pageList = $('.l').first();
    const dropDown = pageList.children()[0];
    const currentPage = dropDown.options[dropDown.selectedIndex].text;
    const totalPages = pageList.text().match(/of (\d+)/i)[1];

    // chapter
    const chapterList = $('#top_chapter_list')[0];
    let nextChapter = "";
    // We check that there is a next chapter available
    if (chapterList.selectedIndex + 1 < chapterList.options.length) {
        nextChapter = chapterList.options[chapterList.selectedIndex + 1].value;
    }

    // If this is the last page and there is no next chapter, we exit the function
    if (nextChapter === "" && currentPage === totalPages) {
        return;
    }

    // next page href
    const mangaPath = document.location.href.match(/^(https:\/\/mangafox\.me\/manga\/\w+\/)/i)[1];
    const nextChaptFirstHref = mangaPath + nextChapter + "/1.html";
    const nextPageHref = (currentPage !== totalPages ? $('.read_img a').attr('href') : nextChaptFirstHref);

    // load next image
    $.get(nextPageHref, (nextPageHTML) => {
        let imgPath = nextPageHTML.match(/[.\s]+<div class="read_img">.+\s+<img src="([^"]+)"/);

        // If we cannot get the image, we do nothing (Have to be improve for blank pages)
        if (imgPath !== null) {
            imgPath = imgPath[1];

            // since the cdn doesn't allow us to get img, we preload it by putting it directly hidden in body
            $('body').append('<img id="mu-preload-img" src="' + imgPath + '">');
            $('#mu-preload-img').hide();
        }
    });
}

// Hightlight bookmarks if last visit is older than last update
function highlightUpdate() {
    const bookmarks = $('ul#bmlist li div.series_grp');

    // If there is no bookmarks, we exit the function
    if (!bookmarks.length) {
        return ;
    }

    bookmarks.map((i, el) => {
        const lastUpdateRaw = $(el).find('dl dt em span.timing');
        const lastVisitRaw = $(el).find('h2 em span.timing');

        // If one of the information is missing, we skip this bookmark
        if (!lastUpdateRaw.length || !lastVisitRaw.length) {
            return ;
        }

        const lastUpdate = convertToTime(lastUpdateRaw.text());
        const lastVisit = convertToTime(lastVisitRaw.text());

        if (lastUpdate > lastVisit) {
            $(el).addClass('mu-update-color');
        }
    });
}

// Convert mangafox bookmarks date to time
function convertToTime(date) {
    const regExpDate = /(Today|Yesterday|(\w+)\s(\d+),\s(\d+))\s(\d+):(\d+)(am|pm)/i;
    const time = regExpDate.exec(date);

    let result;
    if (time[1] === 'Today' || time[1] === 'Yesterday') {
        result = new Date();
        if (time[1] === 'Yesterday') {
            result.setDate(result.getDate() - 1);
        }
    } else {
        result = new Date(time[2] + ' ' + time[3] + ', ' + time[4]);
    }
    const diff = (time[7] === 'am' ? 0 : 12);
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
    const menu = $('<div></div>').attr('id', "mu-menu");
    const deployer = $('<div>-</div>').attr('id', "mu-menu-deployer");
    const content = $('<div></div>').attr('id', "mu-menu-content");
    const tabsMenu = $('<ul></ul>').attr('id', "mu-tabs-menu");
    const tabs = [
        $('<li class="mu-tab">Upgrades</li>'),
        $('<li class="mu-tab">Bug Fixes</li>'),
        $('<li class="mu-tab">Stats</li>')];
    const tabsContent = [
        $('<div id="mu-upgrade-tab" class="mu-tab-content"></div>'),
        $('<div id="mu-bug-tab" class="mu-tab-content"></div>'),
        $('<div id="mu-stat-tab" class="mu-tab-content"></div>')];
    const credit = $('<p id="mu-menu-credits"><a href="https://github.com/Flagoul/mangafox-upgrade" target="_blank">Mangafox-Upgrade</a> @ 2015</p>');

    // Hides the menu depending on last access
    if (getLSNum(showMenuKey) === 0) {
        menu.addClass('mu-menu-hide');
        deployer.text('+');
    }

    // Set the default tab selected
    tabs[0].addClass('mu-tab-selected');
    tabsContent[0].addClass('mu-tab-content-display');

    /* Events */

    $.each(tabs, (index, value) => {
        value.click((e) => {
            const muTabContent = $('.mu-tab-content');
            $('.mu-tab').removeClass('mu-tab-selected');
            muTabContent.removeClass('mu-tab-content-display');

            $(e.currentTarget).addClass('mu-tab-selected');
            muTabContent.eq(index).addClass('mu-tab-content-display');
        });
        tabsMenu.append(value);
    });

    // Show/hide menu when deployer is clicked
    deployer.click((e) => {
        $this = $(e.currentTarget);
        $this.parent().toggleClass('mu-menu-hide');
        toggleLSValue(showMenuKey);
        if ($this.parent().hasClass('mu-menu-hide')) {
            $this.text('+');
        } else {
            $this.text('-');
        }
    });

    /* Creation */

    optionsTab(tabsContent[0], 'upgrade');
    optionsTab(tabsContent[1], 'bug');

    content.append(tabsMenu);
    $.each(tabsContent, (index, value) => {
        content.append(value);
    });
    content.append(credit);
    menu.append(deployer);
    menu.append(content);
    $('body').append(menu);
}

// Create an options tab. Take the tab Object and the name of the index in the options variable
function optionsTab(tab, name) {
    const op = $('<table></table>').addClass("mu-options");
    const content = $('<tbody></tbody>');

    $.each(options[name], (index, value) => {
        const newOption = $('<tr></tr>');
        const checkBoxCell = $('<td></td>').addClass('mu-option-checkbox').addClass('noselect');
        const checkBox = $('<div></div>');
        const desc = $('<td>' + value.description + '</td>').addClass('mu-option-description');

        if (getLSNum(value.value) !== 0) {
            checkBox.addClass('checked');
        }

        checkBox.click((e) => {
            $(e.currentTarget).toggleClass('checked');
            toggleLSValue(value.value);
        });

        checkBoxCell.append(checkBox);
        newOption.append(checkBoxCell).append(desc);
        content.append(newOption);
    });

    op.append(content);
    tab.append(op);
}
