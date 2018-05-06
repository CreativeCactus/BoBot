const natural = require('natural')
const jsdom = require("jsdom").JSDOM;

module.exports = {};

module.exports.GetDOM = (url) => {
  return new Promise((a,r)=>{
    http.get(url, function(res) {
    	var pageData = "";
    	res.setEncoding('utf8');
    	res.on('data', function (chunk) {
    	  pageData += chunk;
    	});

    	res.on('end', function(){
    	  if(!pageData)return
	  return a(new jsdom(pageData,{url}))
	  delete pagedata
    	});
    });
  })
}


// Drinks

var classifier = new natural.BayesClassifier();

add=(str,lbl)=>classifier.addDocument(str,lbl);
add('smash bros bevvies with the bois','beer')
add('Brews and beers with lads and cheers','beer')
add('Celebratory grapes with mates','wine')
add('Fine dine white wine red label vintage','wine')

classifier.train();


const DrinkScrape = (type, cb) => {
	const url = (({
		beer: 'https://www.danmurphys.com.au/dm/search/dm_search_results_gallery.jsp?filterAttribute=webbeertype&filterValue=lager&filterText=Find+Lager+for+any+budget',
		wine: null
	})[type]) || 404;

	const cbf = (cb?cb:a=> console.error('DrinkScrapeWithoutCB!'));
	if (url === 404) return cbf('`Unknown type: '+type+'`');

	jsdom.fromURL(url).then(dom=>{
		let items=Object.assign([], dom.window.document.querySelectorAll("div.product-grid div.independent-product-module"))
		items = items.map(item=>{
			let name = item.querySelector('h2.independent-product-module-title a').textContent.trim()
			let prices = Object.assign([], item.querySelector('ul.independent-pricepoint-list').children)
			return name+'\n\t'+prices.map(p=>p.textContent.trim().replace(/\s+/,' ')).join('\n\t')
		})
		cbf('```'+items.join('\n').slice(0,1900)+'```')
		dom.window.close()
	})
}
module.exports.drinkClassifier=(msg, cb)=>{
	DrinkScrape(classifier.classify(msg), cb)
}

