const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const pandas = require("pandas-js");
const multiparty = require("multiparty");
const fs = require("fs");
const neatCsv = require("neat-csv");
const FoodType = require("../models/FoodType");
const FoodTypeWrapper = require("../models/FoodTypeWrapper")
const ObjectId = mongoose.Types.ObjectId;


async function makeMapFromData(data) {
    const df = new pandas.DataFrame(data);
    let map = new Map();
    for(const x of df) {
        let group = x["_root"].entries[2][1];
        if (map.has(group)) {
            map.set(group, map.get(group) + parseInt(x["_root"].entries[1][1]));
        } else {
            map.set(group, parseInt(x["_root"].entries[1][1]));
        }
    }
    let result = mapToJSON(map);
    return result;
}

function mapToJSON(map) {
    let out = "{"
    for(let key of map.keys()){
        out += "\"" + key + "\": " + map.get(key) + ",";
    }
    out = out.substr(0, out.length - 1);
    out += "}";
    let json_out = JSON.parse(out);
    console.log("restaurant json")
    console.log(json_out)
    return json_out
}
async function parseCSV(path) {
    let data = fs.readFileSync(path);
    let csvData = await neatCsv(data);
    let result = await makeMapFromData(csvData);
    return result;
}

module.exports = {router: router, parsing: parseCSV};
