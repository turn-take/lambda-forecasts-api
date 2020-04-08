"use strict";

const rp = require('request-promise');
const xml2js = require("xml2js");

const AREA_INFO_URL = 'http://weather.livedoor.com/forecast/rss/primary_area.xml'; // エリア情報XML
const FORECAST_URL = 'http://weather.livedoor.com/forecast/webservice/json/v1';  // 天気予報API

// Lambdaのエントリーポイント
exports.handler = async () => {

    return new Promise((resolve) => {
        fetchAreaIDListPromise().then(idList => {
            forecastingPromise(idList).then(array => {

                const body = {};

                body.success = array;
            
                const respose = {
                    statusCode: 200,
                    body: JSON.stringify(body)
                };
            
                resolve(respose);
            });
        }).catch(err => {
            const body = {};

            body.error = 'エラーが発生しました。 エラートレース：' + err;

            const respose = {
                statusCode: 500,
                body: JSON.stringify(body)
            };

            resolve(respose);
        });
    });
};

/**
 * エリア情報XMLからエリアID一覧を取得するPromiseを返す非同期関数
 * @return Promise.resolve(idList)
 */
async function fetchAreaIDListPromise() {
    const idList = [];
    await rp(AREA_INFO_URL)
        .then(data => {
            xml2js.parseString(data, (err, result) => {
                if(err) {
                    throw err;
                }
                const chennel = result.rss.channel;
                chennel.forEach(element => {
                    element['ldWeather:source'][0].pref.forEach(p => {
                        p.city.forEach(c => {
                            const own = c['$'];                
                            idList.push(own.id);
                        });
                    });
                });
            });
        }).catch(err => {
            throw err;
        });
    return idList;
}

/**
 * エリアID一覧から天気予報を作成するPromiseを返す非同期関数
 * @param {array} idList 
 * @return Promise.resolve(array)
 */
async function forecastingPromise(idList) {
    const promiseArray = [];
    const array = [];

    idList.forEach(id => {
        promiseArray.push(fetchForecastAPIPromise(id));
    });

    return await Promise.all(promiseArray).then(datas => {
            datas.forEach(data => {
                array.push(data);
            });
            return array;
        });
}

/**
 * エリアIDから天気予報APIを呼び出し、結果を取得するPromiseを返す非同期関数
 * @param {Number} id 
 * @return Promise.resolve(out)
 */
async function fetchForecastAPIPromise(id) {

    const out = {};

    await rp.get({
        uri: FORECAST_URL,
        qs: {
            'city':id
          }
    }, (err, res, data) => {
        if(err) {
            throw err;
        }
        const jsonData = JSON.parse(data);

        const city = jsonData.location.city;
        
        out.city = city;

        const forecasts = [];
        jsonData.forecasts.forEach(f => {
            const forecast = new Object();
            forecast.date = f.date;
            forecast.telop = f.telop;
            forecasts.push(forecast);
        });
        out.forecasts = forecasts;
        
    }).catch(err => {
        throw err;
    });

    return out;
}