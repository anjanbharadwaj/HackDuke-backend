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
    .post((req, res) => {
        let form = new multiparty.Form();

        form.parse(req, async (err, fields, files) => {
            console.log(files["inventory"][0].path);
            parseCSV(files["inventory"][0].path);
        });
    })

function makeJSONFromData(data) {
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
    mapToJSON(map);
    mapToServer(map);
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
function parseCSV(path) {
    fs.readFile(path, async (error, data) => {
        neatCSV(data).then(data => {
            makeJSONFromData(data);
        })
    })
}

function mapToServer(map) {
    let wrappers = [];
    if (!map.keys().hasNext()){
        return;
    }
    makeWrapper(map, 0, wrappers);
}

function makeWrapper(map, index, wrappers) {
    FoodType.findOne({group: iterToArray(map.keys())[index]}, (err, foodType) => {
        if(err) {
            console.log("err1")
            res.status(400).json({error: err})
        } else if(foodType) {
            const wrapper = new FoodType({
                foodTypeId: ObjectId(foodType),
                amount: map.get(key)
            });
            wrappers.push(wrapper);
            if(index < iterToArray(map.keys()).length - 1) {
                makeWrapper(map, index + 1, wrappers);
            } else {
                pushWrappers(wrappers);
            }
        }
    })
}

function pushWrappers(wrappers) {
    let i = new Inventory(wrappers);
    i.save();
}

function iterToArray(i) {
    let out = [];
    for (let val of i){
        out.push(val);
    }
    return out;
}
