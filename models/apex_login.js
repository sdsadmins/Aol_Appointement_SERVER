const {getRows, insertRow, updateRow, deleteRow} = require('../database/query');
const SqlString = require('sqlstring');
const validationDto = require('../dto/apex_login.dto');
const _ = require('lodash');

exports.find = async (offset, pageSize) => {
    const query = `SELECT t.id, t.apex_role, t.full_name, t.email_id, t.password, t.photo, t.city, t.state, t.country, t.status FROM apex_login as t`;
    return getRows(query,[offset,pageSize]);
}

exports.findOne = async (id) => {
    const query = `SELECT t.id, t.apex_role, t.full_name, t.email_id, t.password, t.photo, t.city, t.state, t.country, t.status FROM apex_login as t WHERE t.id = ? `;
    return getRows(query,[id]);
}

exports.insert = async (object) => {
    const query = `INSERT INTO apex_login SET ?`;
    const id = await insertRow(query, object);
    if(id>0){
        return this.findOne(id);
    }
    else{
        return this.findOne(object.id);
    }
    
}

exports.update = async (id, object) => {
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
    let query = `UPDATE apex_login SET ? WHERE id = ? `;
    updateValues = updateValues.concat([id])
    query = query.replace("?", updateKeys.join(","));
    const result = await updateRow(query, updateValues);
    return result ? this.findOne(id) : null;
}

exports.remove = async (id) => {
    const query = `DELETE from apex_login WHERE id = ? `;
    return deleteRow(query,[id]);
}

exports.count = async () => {
    const query = `SELECT count(*) as total FROM apex_login t `;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}

exports.search = async (offset, pageSize, key) => {
    const query = `SELECT t.id, t.apex_role, t.full_name, t.email_id, t.password, t.photo, t.city, t.state, t.country, t.status FROM apex_login as t WHERE  LOWER(t.id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.apex_role) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.full_name) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.email_id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.password) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.photo) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.city) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.state) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.country) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.status) LIKE `+SqlString.escape('%'+key+'%')+` LIMIT ?,?`;
    return getRows(query,[offset, pageSize]);
}

exports.searchCount = async (key) => {
    const query = `SELECT count(*) as total FROM apex_login t  WHERE  LOWER(t.id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.apex_role) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.full_name) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.email_id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.password) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.photo) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.city) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.state) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.country) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.status) LIKE `+SqlString.escape('%'+key+'%')+``;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}


