const {getRows, insertRow, updateRow, deleteRow} = require('../database/query');
const SqlString = require('sqlstring');
const validationDto = require('../dto/email_template.dto');
const _ = require('lodash');

exports.find = async (offset, pageSize, status) => {
    const query = `SELECT t.id, t.template_name, t.template_subject, t.template_data, t.type, t.status, t.for_the_loc 
                   FROM email_template as t 
                   WHERE t.status = ?`;
    return getRows(query, [status, offset, pageSize]);
}

exports.findOne = async (id) => {
    const query = `SELECT t.id, t.template_name, t.template_subject, t.template_data, t.type, t.status, t.for_the_loc FROM email_template as t WHERE t.id = ? `;
    return getRows(query,[id]);
}

exports.insert = async (object) => {
    const query = `INSERT INTO email_template SET ?`;
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
    let query = `UPDATE email_template SET ? WHERE id = ? `;
    updateValues = updateValues.concat([id])
    query = query.replace("?", updateKeys.join(","));
    const result = await updateRow(query, updateValues);
    return result ? this.findOne(id) : null;
}

exports.remove = async (id) => {
    const query = `DELETE from email_template WHERE id = ? `;
    return deleteRow(query,[id]);
}

exports.count = async () => {
    const query = `SELECT count(*) as total FROM email_template t `;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}

exports.search = async (offset, pageSize, key) => {
    const query = `SELECT t.id, t.template_name, t.template_subject, t.template_data, t.type, t.status, t.for_the_loc FROM email_template as t WHERE  LOWER(t.template_name) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.template_subject) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.template_data) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.type) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.status) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.for_the_loc) LIKE `+SqlString.escape('%'+key+'%')+` LIMIT ?,?`;
    return getRows(query,[offset, pageSize]);
}

exports.searchCount = async (key) => {
    const query = `SELECT count(*) as total FROM email_template t  WHERE  LOWER(t.template_name) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.template_subject) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.template_data) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.type) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.status) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.for_the_loc) LIKE `+SqlString.escape('%'+key+'%')+``;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}


