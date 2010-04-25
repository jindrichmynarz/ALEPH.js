// Knihovna ALEPH.js

var ALEPH = {
  ajax : {
    // Bulletproof xhr instantiation by Jeremy Keith
    getHTTPObject : function() {
      var xhr = false;
      if (window.XMLHttpRequest) {
        xhr = new XMLHttpRequest();
      }
      else {
        try {
          xhr = new ActiveXObject("Msxml2.XMLHTTP");
        } catch( e1 ) {
          try {
            xhr = new ActiveXObject("Microsoft.XMLHTTP");
          } catch( e2 ) {
            xhr = false;
          }
        }
      }
      return xhr;
    },
    getResponse : function( url, callback ) {
      var xhr = ALEPH.ajax.getHTTPObject();
      if ( xhr ) {
        xhr.open( "GET", url, true); // Tady je 
        // podle IE problém. Proč ale Firefox
        // může lokální soubory požadovat?
        xhr.onreadystatechange = function() {
          if ( xhr.readyState === 4 ) {
            if ( xhr.status === 200 || xhr.status === 304 ) {
              callback( xhr );
            }
            else if ( xhr.status === 0 ) {
              // Lokální soubor.
              callback( xhr );
            }
          }
        };
        xhr.send( null );
      }
    }
  },
  cover : {
    checkImage : function( imageLink, callback ) {
      // Zkontroluje, jestli obrázek obálky není
      // prázdný (tj. typu image/gif) a zavolá
      // callback.
      ALEPH.ajax.getResponse( imageLink, function( xhr ) {
        // Získá hlavičku odpovědi pro Content-type.
        var responseMimeType = xhr.getResponseHeader("Content-type");
        // Pokud je Content-type GIF, jde o prázdný obrázek.
        responseMimeType === "image/gif" ? callback(true) : callback(false);
      });
    },
    display : function() {  
      var sysno = ALEPH.dom.getRowValue( "Sysno" );
      var coverImage = document.createElement( "img" );
        coverImage.alt = "Obálka";
        coverImage.src = "http://aleph.techlib.cz/cgi-bin/image.pl?size=big&sn=" + sysno;
      
      ALEPH.cover.checkImage( coverImage.src, function() {
        if( !arguments[0] ) {
          // arguments[0] === false, takže obálku NTK nemá
          var newTr = ALEPH.dom.buildRow( "Obálka", coverImage );
          var location = ALEPH.dom.getRowValue( "Jednotky", 1 );
          location.parentNode.insertBefore( newTr, location.nextSibling );  
        }
      });
    }
  },
  dom : {
    // Podle návěští získá řádek tabulky #fullbody.
    // parametr fullRow, pokud chceme celý řádek
    getRowValue : function( label, fullRow ) {
      var trs = document.getElementById( "fullbody" ).getElementsByTagName( "tr" );
      var trsLen = trs.length,
        tds;
      while ( trsLen-- ) {
        tds = trs[trsLen].getElementsByTagName( "td" );
        var tdsLen = tds.length,
          tdContent;
        while ( tdsLen-- ) {
          if ( tds[tdsLen].width === "15%" ) {
            if ( tds[tdsLen].firstChild.nodeValue ) {
              tdContent = tds[tdsLen].firstChild.nodeValue;
              if ( tdContent.indexOf( label ) !== -1  ) {
                var td = tds[tdsLen].nextSibling;
                if ( fullRow ) {
                  return tds[tdsLen].parentNode;
                }
                // Firefox bere v potaz whitespace (jako TextNode),
                // proto je třeba posunout výběr na další node.
                while ( td ) {
                  if ( td.nodeType === 3 && td.nodeValue.match( /\S/ ) ) {
                    return ALEPH.util.trim( td.nodeValue );
                  }
                  if ( td.nodeType === 3 && !td.nodeValue.match( /\S/ ) ) {
                    td = td.nextSibling;
                  }
                  if ( td.nodeType === 1 ) {
                    td = td.firstChild;
                  }
                }
              }
            }
          }
        }
      }
      return null;
    },
    buildRow : function( label, value ) {
      // vrátí řádek tabulky (<tr>) 
      // s návěštím "label" (TextNode) 
      // a hodnotou "value" (Element)
      if ( typeof label !== typeof "" || value.nodeType !== 1 ) {
        return false;
      }
      
      var newTr = document.createElement( "tr" );
      
      var td1 = document.createElement( "td" );
      td1.className = "td1";
      td1.id = "bold";
      td1.style.verticalAlign = "top";
      
      td1.width = "15%";
      td1.nowrap = "nowrap";
      var td1Text = document.createTextNode( label );
      td1.appendChild( td1Text );
      
      var td2 = document.createElement( "td" );
      td2.className = "td1";
      td2.align = "left";
      td2.appendChild( value );
      
      newTr.appendChild( td1 );
      newTr.appendChild( td2 );
      
      return newTr;
    },
    createScript : function( scriptUrl, encode ) {
      // encode = {true; false}, určuje, zdali se má scriptUrl kódovat
      var newScript = document.createElement("script");
      newScript.src = encode ? encodeURI( scriptUrl ) : scriptUrl;
      newScript.type = 'text/javascript';
      newScript.charset = 'utf-8';
      document.getElementsByTagName("head")[0].appendChild( newScript );
    }
  },
  eod : {
    sysno : false,
    callback : function(json) {
      var entries = json.feed.entry,
        entriesLen = entries.length,
        display = true,
        parsedSysNo = parseInt(ALEPH.eod.sysno, 10),
        actualSysNo = null;
      while (entriesLen--) {
        actualSysNo = parseInt(entries[entriesLen].content.$t, 10);
        if (actualSysNo === parsedSysNo) {
          display = false;
        }
      }
      if (display) {
        ALEPH.eod.display();
      }
    },
    display : function() {
      var eodLink = document.createElement( "a" );
      eodLink.href = "http://books2ebooks.eu/odm/orderformular.do?formular_id=221&sys_id=" + ALEPH.eod.sysno;
      eodLink.setAttribute( "target", "_blank" );
      eodLink.setAttribute( "title", "DoD" );
      eodLink.innerHTML = "<img src=\"http://aleph.techlib.cz/ikony/eod_icon.png\"" +
        " border=\"0\" title=\"EOD - eBooks on Demand\" alt=\"EOD - eBooks on Demand\" />";
      ALEPH.ui.addWidget( eodLink );
    },
    init : function() {
      var eod = ALEPH.dom.getRowValue( "EOD", 1 ),
        limit = 1909; // do tohoto roku lze v rámci EOD digitalizovat
      if ( eod ) {
        ALEPH.eod.sysno = ALEPH.dom.getRowValue( "Sysno" );
        year = ALEPH.dom.getRowValue( "Naklad", 1 ).innerHTML.match( /\d{4}/ );
        if ( year ) {
          year = year[0];
          if ( year <= limit ) {
            ALEPH.dom.createScript("http://spreadsheets.google.com/feeds/cells/tBuTyis1-RsCe6M1yWjPIjQ/1/public/basic?alt=json-in-script&callback=ALEPH.eod.callback");
          }
        }
        eod.parentNode.removeChild( eod );
        return null;
      }
      else {
        return null;
      }
    }
  },
  exhibits : {
    // Obrázkové náhledy naskenovaných historických dokumentů.
    var sysno = ALEPH.dom.getRowValue("Sysno"),
      url = "http://aleph.techlib.cz/cgi-bin/obrazek.pl?sn=" + sysno;
    ALEPH.ajax.getResponse(url, function(xhr) {
      var json = JSON.parse(xhr.responseText); // Dodělat parsování JSONu pomocí knihovny json2.js
      if (typeof json.images !== "undefined" && json.images.length) {
        var exhibits = document.createElement( "a" );
        // Dodělat budování HTML
        // Testovat na příkladu: http://aleph.techlib.cz/cgi-bin/obrazek.pl?sn=000604149
        ALEPH.ui.addWidget(exhibits);
      }
    });
  },
  sfx : {
    modifyAlephSfxLink : function() {
      // Najde element <a> pro SFX.
      var sfxAnchor = document.getElementById( "sfx" ).getElementsByTagName( "a" )[0];
      // Z jeho atributu href získá URL adresu.
      var sfxLink = sfxAnchor.href.match(/(http.*F)\/.*(\?.*)\'/);
      sfxLink = sfxLink[1] + sfxLink[2];
      // AJAXové volání právě získané URL adresy.
      ALEPH.ajax.getResponse( sfxLink, function( xhr ) {
        var response = xhr.responseText;
        response = response.slice( response.indexOf( "var url" ), response.indexOf( "if" ) );
        response = ALEPH.util.trim( response );
        response = response.split( "'" );
        // Spojí sudé části pole do výstupního řetězce.
        for (  var i = 1, responseLen = response.length, url = ""; i < responseLen; i += 2 ) {
          url += response[i];
        }
        url += "__service_type=getFullTxt&__response_type=image-large";
        sfxAnchor.getElementsByTagName( "img" )[0].src = url;
      });
    }
  },
  ui : {
    addWidget : function( widget ) {
      // widget ... HTML element obsahující celý widget
      // Dodělat!
      var url = window.location.href;
      // Widget bude přidán pouze v případě, pokud jde o výchozí zobrazení záznamu
      if ((url.indexOf("format=999") !== -1) || (url.indexOf("format=") === -1)) {
        var toolsLocation = document.getElementById( "lcc_place" );
        // CSS reset
        ALEPH.util.applyCSS( toolsLocation, {
            padding : 0
        });
        ALEPH.util.applyCSS( widget, {
            margin : "0 0 3px 0",
            display : "block",
            cursor : "pointer"
        });
        // V budoucnu změnit LCC place na něco jiného
        toolsLocation.appendChild( widget );
      }
    },
    // Vytvoří odkaz na mapu fondu.
    lccMapLink : function() {
      var lccPart = ALEPH.dom.getRowValue( "LCC" );
      if ( lccPart ) {
        // vybere vše až po nezlomitelnou mezeru (&nbsp;)
        lccPart = lccPart.match(/.*(?=\u00A0)/);
        if ( lccPart ) {
          lccPart = ALEPH.util.trim( lccPart[0] );
          // vytvoření nového odkazu
          var mapLink = document.createElement( "a" );
          mapLink.rel = "lightbox[aleph]";
          mapLink.href = "http://www.techlib.cz/user-actions/get-location-image/lcc/" + lccPart;
          mapLink.title = "Zobrazit, kde se dokument nachází";
          var imgMapLink = document.createElement( "img" );
          imgMapLink.src = "http://aleph.ntkcz.cz/ikony/lccmap_icon.png";
          imgMapLink.border = 0;
          mapLink.appendChild( imgMapLink );
          ALEPH.ui.addWidget( mapLink );
        }
      }
      else {
        return null;
      }
    },
    linkTitle : {
      // Vytvoří z názvů v tabulce výsledků vyhledávání
      // Aleph OPACu odkazy vedoucí na bibliografické záznamy.
      //
      // Vzhledem k nevalidnímu HTML kódu Aleph OPACu na něj
      // nelze používat velkou část standardních metod navigace
      // v DOMu, takže se skript spoléhá na aktuální strukturu
      // stránky.
      //
      // Zaprvé: je třeba získat přístup k odkazu
      // získání všech elementů <a>
      getHrefs : function() {
        var links = document.getElementsByTagName( "a" );
        var hrefs = [];
        var linksLen = links.length;
        while ( linksLen-- ) {
          // očištění pouze na žádané elementy <a>
          if ( ( links[linksLen].href.indexOf( "format=999" ) !== -1 ) && 
            links[linksLen].firstChild.nodeValue.match( /^\d+$/ ) ) {
            // uložení odkazu
            hrefs.push( links[linksLen].href );
          }
        }
        return hrefs;
      },
      // Zadruhé: je třeba získat přístup k textu názvu
      // získání všech elementů <td>
      getParents : function() {
        var titles = document.getElementsByTagName( "td" );
        var parents = [];
        var titlesLen = titles.length;
        while ( titlesLen-- ) {
          // očištění pouze na žádané elementy <td>
          title = titles[titlesLen];
          if ( title.width === "30%" && title.className.indexOf("td1 linkTitle") !== -1) {
            // zápis elementů do arraye
            parents.push(title);
          }
        }
        return parents;
      },
      // Zatřetí: je třeba vytvořit element <a> s odkazem a textem názvu
      display : function() {
        var hrefs = ALEPH.ui.linkTitle.getHrefs();
        var parents = ALEPH.ui.linkTitle.getParents();
        if ( hrefs.length === parents.length ) {
          var hrefsLen = hrefs.length,
            newLinks = [],
            newLink,
            parent;
          while ( hrefsLen-- ) {
            parent = parents[hrefsLen];
            
            newLink = newLinks[hrefsLen];
            newLink = document.createElement( "a" );
            newLink.href = hrefs[hrefsLen];
            
            newLink.innerHTML = ALEPH.util.trim( parent.innerHTML );
            
            // nahrazení původního obsahu nově vytvořeným elementem
            parent.innerHTML = "";
            parent.appendChild( newLink );
          }
          return true;
        }
        return false;
      }
    },
    RSS : {
      getISSN : function() {
        var issn = ALEPH.dom.getRowValue( "ISSN" );
        if ( issn ) {
          issn = issn.match(/\d{4}-[\dX]{4}/)[0];
          return issn;
        }
        else {
          return false;
        }
      },
      createScript : function( issn ) {
        var scriptUrl = "http://tictoclookup.appspot.com/" +
          issn + "?jsoncallback=ALEPH.ui.RSS.getLink";
        ALEPH.dom.createScript( scriptUrl, true );
      },
      getLink : function( json ) {
        if ( json.records.length > 0 ) {
          var rssLink = json.records[0].rssfeed;
          
          var link = document.createElement( "a" );
          link.href = rssLink;
          var linkImage = document.createElement( "img" );
          linkImage.src = "http://aleph.ntkcz.cz/ikony/rss_icon.png";
          linkImage.alt = "RSS časopisu";
          linkImage.title = "Zobrazit RSS tohoto časopisu";
          link.appendChild( linkImage );
          
          ALEPH.ui.addWidget( link );
        }
      },
      display : function() {
        var issn = ALEPH.ui.RSS.getISSN();
        if ( issn ) {
          ALEPH.ui.RSS.createScript( issn );
        }
      }
    },
    shortenUrl : {
      // inicializace stavových proměnných
      loaded : false,
      placement : false,
      clicked : false,
      shortUrl : false,
      longUrl : false,
      image : false,
      init : function() {
        ALEPH.ui.shortenUrl.image = document.createElement( "img" );
        ALEPH.ui.shortenUrl.image.src = "http://aleph.ntkcz.cz/ikony/shortenurl_icon.png";
        ALEPH.ui.shortenUrl.image.title = "Zobrazit krátké URL";
        ALEPH.ui.shortenUrl.image.border = "0";
        
        // Chtělo by to lépe zorganizovat ikony v pravé části
        // obrazovky, nejlépe změnit id = "lcc_place" třeba na "sidebar_tools"
        // a do této buňky (<td>) vše vkládat.
        ALEPH.ui.addWidget( ALEPH.ui.shortenUrl.image );
        
        ALEPH.util.addEvent( ALEPH.ui.shortenUrl.image, "click", ALEPH.ui.shortenUrl.getShortUrl );
      },
      getLongUrl : function() {
        var sysNo = ALEPH.util.trim( ALEPH.dom.getRowValue( "Sysno" ) );
        ALEPH.ui.shortenUrl.longUrl = "http://aleph.techlib.cz/F/?func=direct&doc_number=" + 
          sysNo;
      },
      getShortUrl : function() {
        if ( !ALEPH.ui.shortenUrl.clicked ) {
          ALEPH.ui.shortenUrl.clicked = true;
          if ( !ALEPH.ui.shortenUrl.loaded ) {
            // Není načteno, načteme
            ALEPH.ui.shortenUrl.load();
          }
          else {
            // Je načteno, zobrazíme
            document.getElementById( "shortLinkPar" ).style.display = "block";
          }
        }
        else {
          // Schováme
          ALEPH.ui.shortenUrl.clicked = false;
          document.getElementById( "shortLinkPar" ).style.display = "none";
        }
        return false;
      },
      load : function() {
        var login = "techlib";
        var apiKey = "R_3ecf3c8f0ca8614028a56c7368be0947";
        ALEPH.ui.shortenUrl.getLongUrl();
        var longUrlEscaped = ALEPH.ui.shortenUrl.longUrl.replace( "&", "%26" ).replace( "?", "%3F" );
        var url = "http://api.bit.ly/shorten?version=2.0.1&login=" +
          login + "&apiKey=" + apiKey + "&longUrl=" + longUrlEscaped +
          "&callback=ALEPH.ui.shortenUrl.callback";
        
        ALEPH.dom.createScript( url );
      },
      callback : function( json ) {
        ALEPH.ui.shortenUrl.loaded = true;
        if ( json.statusCode === "OK" ) {
          var shortLink = document.createElement( "input" );
          shortLink.type = "text";
          shortLink.id = "shortLink";
          shortLink.value = json.results[ALEPH.ui.shortenUrl.longUrl].shortUrl;
          ALEPH.util.applyCSS( shortLink, {
            width : "120px"
          });
          
          // Build the DOM
          var p = document.createElement( "p" );
          p.id = "shortLinkPar";
          var placementPosition = ALEPH.util.findPosition( ALEPH.ui.shortenUrl.image );
          ALEPH.util.applyCSS( p, {
            position : "absolute",
            width: 150,
            top : placementPosition.top - 5,
            left : placementPosition.left - 205,
            background : "#eee",
            border : "solid 1px #ddd",
            padding : ".5em 1em"
          });
          var label = document.createElement( "label" );
          label.htmlFor = "shortLink";
          var labelText = document.createTextNode( "Krátký odkaz: " );
          label.appendChild( labelText );
          p.appendChild( label );
          p.appendChild( shortLink );
          ALEPH.ui.shortenUrl.image.parentNode.insertBefore( p, ALEPH.ui.shortenUrl.image );
        }
      }
    }
  },
  util : {
    // John Resig's addEvent function
    // URL: http://ejohn.org/blog/flexible-javascript-events/
    addEvent : function( obj, type, fn ) {
      if ( obj.attachEvent ) {
        obj['e' + type + fn] = fn;
        obj[type + fn] = function() {
          obj['e' + type + fn]( window.event );
        };
        obj.attachEvent( 'on' + type, obj[type + fn] );
      } 
      else {
        obj.addEventListener( type, fn, false );
      }
    },
    // Aplikuje na element více CSS pravidel ve tvaru 
    // styles = { color : "red", border : "solid 2px blue" }
    applyCSS : function( element, styles ) {
      for ( var property in styles ) {
        if ( !styles.hasOwnProperty || styles.hasOwnProperty( property ) ) {
          element.style[property] = styles[property];
        }
      }
      return element;
    },
    // Peter-Paul Koch findPos function, s drobnými úpravami
    // http://www.quirksmode.org/js/findpos.html
    findPosition : function( element ) {
      var curleft = 0,
        curtop = 0;
      if ( element.offsetParent ) {
        do {
          curleft += element.offsetLeft;
          curtop += element.offsetTop;
        }
        while ( element = element.offsetParent ); // Tady tohle přiřazení je hack.
      }
      return { left : curleft, top : curtop };
    },
    // Odstraní whitespace na koncích řetězce.
    trim : function( text ) {
      return text.replace(/^\s+|\s+$/g,"");
    }
  }
};
// Konec knihovny ALEPH.js
