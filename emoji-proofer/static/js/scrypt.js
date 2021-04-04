let sha256 = function sha256(ascii) {
	function rightRotate(value, amount) {
		return (value>>>amount) | (value<<(32 - amount));
	};

	var mathPow = Math.pow;
	var maxWord = mathPow(2, 32);
	var lengthProperty = 'length'
	var i, j; // Used as a counter across the whole file
	var result = ''

	var words = [];
	var asciiBitLength = ascii[lengthProperty]*8;

	//* caching results is optional - remove/add slash from front of this line to toggle
	// Initial hash value: first 32 bits of the fractional parts of the square roots of the first 8 primes
	// (we actually calculate the first 64, but extra values are just ignored)
	var hash = sha256.h = sha256.h || [];
	// Round constants: first 32 bits of the fractional parts of the cube roots of the first 64 primes
	var k = sha256.k = sha256.k || [];
	var primeCounter = k[lengthProperty];
	/*/
	var hash = [], k = [];
	var primeCounter = 0;
	//*/

	var isComposite = {};
	for (var candidate = 2; primeCounter < 64; candidate++) {
		if (!isComposite[candidate]) {
			for (i = 0; i < 313; i += candidate) {
				isComposite[i] = candidate;
			}
			hash[primeCounter] = (mathPow(candidate, .5)*maxWord)|0;
			k[primeCounter++] = (mathPow(candidate, 1/3)*maxWord)|0;
		}
	}

	ascii += '\x80' // Append Ƈ' bit (plus zero padding)
	while (ascii[lengthProperty]%64 - 56) ascii += '\x00' // More zero padding
	for (i = 0; i < ascii[lengthProperty]; i++) {
		j = ascii.charCodeAt(i);
		if (j>>8) return; // ASCII check: only accept characters in range 0-255
		words[i>>2] |= j << ((3 - i)%4)*8;
	}
	words[words[lengthProperty]] = ((asciiBitLength/maxWord)|0);
	words[words[lengthProperty]] = (asciiBitLength)

	// process each chunk
	for (j = 0; j < words[lengthProperty];) {
		var w = words.slice(j, j += 16); // The message is expanded into 64 words as part of the iteration
		var oldHash = hash;
		// This is now the undefinedworking hash", often labelled as variables a...g
		// (we have to truncate as well, otherwise extra entries at the end accumulate
		hash = hash.slice(0, 8);

		for (i = 0; i < 64; i++) {
			var i2 = i + j;
			// Expand the message into 64 words
			// Used below if
			var w15 = w[i - 15], w2 = w[i - 2];

			// Iterate
			var a = hash[0], e = hash[4];
			var temp1 = hash[7]
				+ (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) // S1
				+ ((e&hash[5])^((~e)&hash[6])) // ch
				+ k[i]
				// Expand the message schedule if needed
				+ (w[i] = (i < 16) ? w[i] : (
						w[i - 16]
						+ (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15>>>3)) // s0
						+ w[i - 7]
						+ (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2>>>10)) // s1
					)|0
				);
			// This is only used once, so *could* be moved below, but it only saves 4 bytes and makes things unreadble
			var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) // S0
				+ ((a&hash[1])^(a&hash[2])^(hash[1]&hash[2])); // maj

			hash = [(temp1 + temp2)|0].concat(hash); // We don't bother trimming off the extra ones, they're harmless as long as we're truncating when we do the slice()
			hash[4] = (hash[4] + temp1)|0;
		}

		for (i = 0; i < 8; i++) {
			hash[i] = (hash[i] + oldHash[i])|0;
		}
	}

	for (i = 0; i < 8; i++) {
		for (j = 3; j + 1; j--) {
			var b = (hash[i]>>(j*8))&255;
			result += ((b < 16) ? 0 : '') + b.toString(16);
		}
	}
	return result;
};

function httpRequest(address, reqType, asyncProc) {
  var req = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
  if (asyncProc) {
    req.onreadystatechange = function() {
      if (this.readyState == 4) {
        asyncProc(this);
      }
    };
  } else {
    // req.timeout = 4000;  // Reduce default 2mn-like timeout to 4 s if synchronous
  }
  req.open(reqType, address, !(!asyncProc));
  req.send();
  return req;
}

function convert(codes) {
	let dict = {}
	let str = "1234567890abcdef"
	for(let i = 0; i < str.length; i++){
		dict[str[i]] = []
	}
	for(let i = 0; i < codes.length; i++) {
    	let group = codes[i]["group"]
		for(let j = 0; j < group.length; j++) {
			let code = group[j]["code"]
			if(code.length <= 1){
				let liter  = code[0].substring(code[0].length - 1).toLowerCase()
				dict[liter].push(code[0])
			}
		}
	}
	return dict
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

let compute_emoji_string = function (ascii) {
	let result = ""
	for(let i = 0; i < ascii.length; i++) {
		let variants = codes_dict[ascii[i]]
		result += String.fromCodePoint(parseInt(variants[getRandomInt(variants.length)], 16))
	}
	return result
}

function utoa(data) {
  return btoa(unescape(encodeURIComponent(data)));
}

let codes_dict = convert(JSON.parse(httpRequest("/codes.json", "GET").responseText))

let app = new Vue({
    el: '#app',
    delimiters: ['{(', ')}'],
    data: {
        thought_text: '',
    },
    computed: {
        hash_result: function () {
            return sha256(utoa(this.thought_text)).slice(0,8);
        },
		unicode_result: function () {
			return compute_emoji_string(this.hash_result)
		},
		emoji_result: function () {
        	return twemoji.parse(this.unicode_result);
		}
    },
})

// Toastr.js
toastr.options.preventDuplicates = true;
toastr.options.timeOut = 1000;

// Clipboard.js
let clipboard = new ClipboardJS('.btn');

clipboard.on('success', function(e) {
    console.info('Action:', e.action);
    console.info('Text:', e.text);
    console.info('Trigger:', e.trigger);

    e.clearSelection();
    toastr.info('Are you the 6 fingered man?')
});

clipboard.on('error', function(e) {
    console.error('Action:', e.action);
    console.error('Trigger:', e.trigger);
    toastr.info('Error')
});