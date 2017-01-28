var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
// var geocoder = require('node-geocoder')('google', 'https', {apiKey: "***"});
var geocoder = require('node-geocoder')('openstreetmap', 'https');
// var geocoder = require('node-geocoder')('yandex', 'https', {language: "es"});

function flatten(arr) {
  return arr.reduce(function (flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  }, []);
}



const promisesBanks = fs
        .readdirAsync("./banks")
        .then(function(files){
            return files
                .map(path => require(`./banks/${path}`))
                .map(sucursales => {
                    return sucursales.map(bank => {
                        return geocoder
                            .geocode(`${bank.address} ${bank.postal_code} Barcelona`)
                            .then(function(res){
                                if (res && typeof res[0] !== 'undefined' && res[0].hasOwnProperty("latitude")) {
                                    return {
                                        bank: bank.bank,
                                        address: bank.address,
                                        office: bank.office,
                                        latitude: res[0].latitude,
                                        longitude: res[0].longitude,
                                        country: res[0].country,
                                        countryCode: res[0].countryCode,
                                        city: res[0].city,
                                        zipcode: res[0].zipcode
                                    };
                                }else{
                                    return {};
                                }
                            })
                    })
                })
        });

Promise
    .all(flatten(promisesBanks))
    .then(fullBanksInfo => {
        const data = fullBanksInfo.filter(bank => bank.hasOwnProperty("latitude"));
        fs.writeFile('banks_auto.json', JSON.stringify(data, null, 2));
        console.log("Done!");
    })
    .catch(console.error.bind(console))

