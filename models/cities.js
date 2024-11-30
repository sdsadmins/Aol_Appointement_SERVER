const {getRows, insertRow, updateRow, deleteRow} = require('../database/query');
const SqlString = require('sqlstring');
const validationDto = require('../dto/cities.dto');
const _ = require('lodash');

exports.find = async (offset, pageSize) => {
    const query = `SELECT t.prid, t.id, t.city_name, t.state_id FROM cities as t`;
    return getRows(query,[offset,pageSize]);
}

exports.findOne = async (prid) => {
    const query = `SELECT t.prid, t.id, t.city_name, t.state_id FROM cities as t WHERE t.prid = ? `;
    return getRows(query,[prid]);
}

exports.insert = async (object) => {
    const query = `INSERT INTO cities SET ?`;
    const id = await insertRow(query, object);
    if(id>0){
        return this.findOne(id);
    }
    else{
        return this.findOne(object.prid);
    }
    
}

exports.update = async (prid, object) => {
    const updateKeys = [];
    let updateValues = [];
    for (const key in object) {
    if (validationDto.hasOwnProperty(key)) {
        updateKeys.push(`${key}=?`);
         if(_.isNumber(object[key])){
            updateValues.push(+object[key]);
        }else{
            updateValues.push(`${object[key]}`);
        }
        }
    }
    let query = `UPDATE cities SET ? WHERE prid = ? `;
    updateValues = updateValues.concat([prid])
    query = query.replace("?", updateKeys.join(","));
    const result = await updateRow(query, updateValues);
    return result ? this.findOne(prid) : null;
}

exports.remove = async (prid) => {
    const query = `DELETE from cities WHERE prid = ? `;
    return deleteRow(query,[prid]);
}

exports.count = async () => {
    const query = `SELECT count(*) as total FROM cities t `;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}

exports.search = async (offset, pageSize, key) => {
    const query = `SELECT t.prid, t.id, t.city_name, t.state_id FROM cities as t WHERE  LOWER(t.id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.city_name) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.state_id) LIKE `+SqlString.escape('%'+key+'%')+` LIMIT ?,?`;
    return getRows(query,[offset, pageSize]);
}

exports.searchCount = async (key) => {
    const query = `SELECT count(*) as total FROM cities t  WHERE  LOWER(t.id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.city_name) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.state_id) LIKE `+SqlString.escape('%'+key+'%')+``;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}


