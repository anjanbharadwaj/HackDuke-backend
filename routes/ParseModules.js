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
        neatCsv(data).then(data => {
            makeJSONFromData(data);
        })
    })
}

function mapToServer(map) {
    console.log("Map to Server Called");
    let wrappers = [];
    if (iterToArray(map.keys()).length === 0){
        return;
    }
    makeWrapper(map, 0, wrappers);
}

function makeWrapper(map, index, wrappers) {
    console.log("Wrapper " + index + " is being made, looking for " + iterToArray(map.keys())[index]);
    FoodType.findOne({group: iterToArray(map.keys())[index]}, (err, foodType) => {
        if(err) {
            console.log("err1");
        } else if(foodType) {
            console.log(iterToArray(map.keys())[index] + " was found");
            const wrapper = new FoodTypeWrapper({
                foodTypeId: foodType._id,
                amount: map.get(iterToArray(map.keys())[index])
            });
            console.log("wrapper was made");
            wrappers.push(wrapper);
            if(index < iterToArray(map.keys()).length - 1) {
                makeWrapper(map, index + 1, wrappers);
            } else {
                console.log("All wrappers are made");
                pushWrappers(wrappers);
            }
        }
    })
}

function pushWrappers(wrappers) {
    console.log(wrappers);
    let i = new Inventory({
        foodTypeWrapperIds: wrappers
    });
    i.save().then(() => {
        console.log("Saved");
    });
}

function iterToArray(i) {
    let out = [];
    for (let val of i){
        out.push(val);
    }
    return out;
}

module.exports = router;
