//Import package
// import { Client, auth } from "twitter-api-sdk";
import { getFollowers, getTweets } from "./twt_api.js"
import { sendDyn, scanDyn } from "./dyn_api.js"
import fs from "fs"

const makeFollowersDynObj = (twtObj) => {

    return new Promise((resolve, reject) => {
        const fetchTime = new Date().toISOString().slice(0, -2);
        const twtData = twtObj.data;
        console.log(JSON.stringify(twtObj, null, 2));
        const twtDataPM = twtData.public_metrics;
        if (!twtData.verified) {
            reject("this twitter account is not verified");
        } else {
            resolve(
                {
                    TableName: "twt_api_pjsekai",
                    Item: {
                        fetch_time: { S: fetchTime },
                        followers_count: { N: twtDataPM.followers_count.toString() }
                    }
                }
            );
        }
    })
};

const scanParam = { TableName: "twt_main_flwers" };
const userName = process.env["ACCOUNT"]

const flwObj = await getFollowers(userName);
/* DEPRECATED to be deleted*/
// const dynObj = await makeFollowersDynObj(flwObj)
// sendDyn(dynObj);
/* DEPRECATED to be deleted*/

console.log("User id: " + flwObj.data.id);
const twtArr = await getTweets(flwObj.data.id);
console.log(JSON.stringify(twtArr.slice(-1, twtArr.length), null, 2));
console.log("Tweet count size: " + twtArr.length);

for (const twt of twtArr.slice(-2, twtArr.length)) {
    console.log(`${twt.created_at} https://twitter.com/${userName}/status/${twt.id}`)
};

const twtArrRef = twtArr.filter(el => "referenced_tweets" in el);
console.log("Referenced tweet count size: " + twtArrRef.length);
const twtArrRefMulti = twtArrRef.filter(el => el.referenced_tweets.length > 1);
console.log("Multi referenced tweet count size: " + twtArrRefMulti.length);

for (const twt of twtArrRef.slice(-2, twtArrRef.length)) {
    console.log(`${twt.created_at} https://twitter.com/${userName}/status/${twt.id}`)
    console.log(twt.referenced_tweets)
};

const twtCsv = twtArr.reduce((prev, curr) => {
    const referenced = "referenced_tweets" in curr ? curr.referenced_tweets[0].type.slice(0, 3).toUpperCase() : "ORG"
    prev += `${curr.created_at.slice(0, -2)},${referenced},https://twitter.com/${userName}/status/${curr.id}\n`;
    return prev;
}, 'time,referenced,url\n');
fs.writeFileSync("./twtResults.csv", twtCsv);

// DO NOT DELETE BELOW

const dynScan = await scanDyn(scanParam);

const outputCsv = dynScan.reduce((prev, curr) => {
    prev += `${curr["fetch_time"]["S"]},${curr["followers_count"]["N"]}\n`;
    return prev;
}, 'fetch_time,followers_count\n');
fs.writeFileSync("./results.csv", outputCsv);