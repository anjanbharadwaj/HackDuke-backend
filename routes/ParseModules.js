const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const pandas = require("pandas-js");
const multiparty = require("multiparty");
const fs = require("fs");
const neatCsv = require("neat-csv");
const FoodType = require("../models/FoodType");
const FoodTypeWrapper = require("../models/FoodTypeWrapper")
const Inventory = require("../models/Inventory")
const ObjectId = mongoose.Types.ObjectId;

router.route("/")
    .post(async (req, res) => {
        let form = new multiparty.Form();

        form.parse(req, async (err, fields, files) => {
            let result = await parseCSV(files["inventory"][0].path);

        });
    })

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
    //mapToJSON(map);
    let result = await mapToServer(map);
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
}
async function parseCSV(path) {
    let data = fs.readFileSync(path);
    let csvData = await neatCsv(data);
    let result = await makeMapFromData(csvData);
    return result;
}

async function mapToServer(map) {
    let wrappers = [];
    if (iterToArray(map.keys()).length === 0){
        return;
    }
    for(let i = 0; i < iterToArray(map.keys()).length; i++) {
        await makeWrapper(map, i, wrappers);
    }
    let result = await pushWrappers(wrappers);
    console.log("PUSH WRAPPERS RESULT: " + result);
    return result;
}

async function makeWrapper(map, index, wrappers) {
    return await FoodType.findOne({group: iterToArray(map.keys())[index]}, (err, foodType) => {
        if(err) {
            console.log("err1");
        } else if(foodType) {
            console.log(iterToArray(map.keys())[index] + " was found");
            const wrapper = new FoodTypeWrapper({
                foodTypeId: foodType._id,
                amount: map.get(iterToArray(map.keys())[index])
            });
            wrappers.push(wrapper);
        }
    }).exec()
}

async function pushWrappers(wrappers) {
    let i = new Inventory({
        foodTypeWrapperIds: wrappers
    });
    await i.save();
    console.log(i);
    return i;
}

function iterToArray(i) {
    let out = [];
    for (let val of i){
        out.push(val);
    }
    return out;
}

module.exports = {router: router, parsing: parseCSV};
