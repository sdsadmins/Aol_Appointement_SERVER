const {getRows, insertRow, updateRow, deleteRow} = require('../database/query');
const SqlString = require('sqlstring');
const validationDto = require('../dto/users_reg.dto');
const _ = require('lodash');

exports.find = async (offset, pageSize) => {
    const query = `SELECT t.id, t.title, t.full_name, t.email_id, t.designation, t.company, t.aol_teacher, t.teacher_code, t.teach_courses, t.address, t.password, t.country_code, t.phone_no, t.city, t.state, t.post_code, t.country, t.photo, t.tags, t.status, t.entry_date FROM users_reg as t`;
    return getRows(query,[offset,pageSize]);
}

exports.findOne = async (id) => {
    const query = `SELECT t.id, t.title, t.full_name, t.email_id, t.designation, t.company, t.aol_teacher, t.teacher_code, t.teach_courses, t.address, t.password, t.country_code, t.phone_no, t.city, t.state, t.post_code, t.country, t.photo, t.tags, t.status, t.entry_date FROM users_reg as t WHERE t.id = ? `;
    return getRows(query,[id]);
}

exports.insert = async (object) => {
    const query = `INSERT INTO users_reg SET ?`;
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
    let query = `UPDATE users_reg SET ? WHERE id = ? `;
    updateValues = updateValues.concat([id])
    query = query.replace("?", updateKeys.join(","));
    const result = await updateRow(query, updateValues);
    return result ? this.findOne(id) : null;
}

exports.remove = async (id) => {
    const query = `DELETE from users_reg WHERE id = ? `;
    return deleteRow(query,[id]);
}

exports.count = async () => {
    const query = `SELECT count(*) as total FROM users_reg t `;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}

exports.search = async (offset, pageSize, key) => {
    const query = `SELECT t.id, t.title, t.full_name, t.email_id, t.designation, t.company, t.aol_teacher, t.teacher_code, t.teach_courses, t.address, t.password, t.country_code, t.phone_no, t.city, t.state, t.post_code, t.country, t.photo, t.tags, t.status, t.entry_date FROM users_reg as t WHERE  LOWER(t.title) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.full_name) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.email_id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.designation) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.company) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.aol_teacher) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.teacher_code) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.teach_courses) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.address) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.password) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.country_code) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.phone_no) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.city) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.state) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.post_code) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.country) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.photo) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.tags) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.status) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.entry_date) LIKE `+SqlString.escape('%'+key+'%')+` LIMIT ?,?`;
    return getRows(query,[offset, pageSize]);
}

exports.searchCount = async (key) => {
    const query = `SELECT count(*) as total FROM users_reg t  WHERE  LOWER(t.title) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.full_name) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.email_id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.designation) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.company) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.aol_teacher) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.teacher_code) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.teach_courses) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.address) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.password) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.country_code) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.phone_no) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.city) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.state) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.post_code) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.country) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.photo) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.tags) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.status) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.entry_date) LIKE `+SqlString.escape('%'+key+'%')+``;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}

exports.updatePasswordByEmail = async (email, hashedPassword) => {
    const query = `UPDATE users_reg SET password = ? WHERE email_id = ?`;
    const result = await updateRow(query, [hashedPassword, email]);
    return result ? true : false;
}

exports.findOneByEmail = async (email) => {
    const query = `SELECT * FROM users_reg WHERE email_id = ?`;
    return getRows(query, [email]);
}


