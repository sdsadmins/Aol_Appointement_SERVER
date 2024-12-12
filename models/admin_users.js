const {getRows, insertRow, updateRow, deleteRow} = require('../database/query');
const SqlString = require('sqlstring');
const validationDto = require('../dto/admin_users.dto');
const _ = require('lodash');

exports.find = async (offset, pageSize) => {
    const query = `SELECT t.id, t.email_id, t.password, t.user_location, t.role, t.city_wise, t.full_name, t.sort_name, t.show_appts_of, t.extra_sign FROM admin_users as t`;
    return getRows(query,[offset,pageSize]);
}

exports.findOne = async (id) => {
    const query = `SELECT t.id, t.email_id, t.password, t.user_location, t.role, t.city_wise, t.full_name, t.sort_name, t.show_appts_of, t.extra_sign FROM admin_users as t WHERE t.id = ? `;
    return getRows(query,[id]);
}

exports.insert = async (object) => {
    const query = `INSERT INTO admin_users SET ?`;
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
    let query = `UPDATE admin_users SET ? WHERE id = ? `;
    updateValues = updateValues.concat([id])
    query = query.replace("?", updateKeys.join(","));
    const result = await updateRow(query, updateValues);
    return result ? this.findOne(id) : null;
}

exports.remove = async (id) => {
    const query = `DELETE from admin_users WHERE id = ? `;
    return deleteRow(query,[id]);
}

exports.count = async () => {
    const query = `SELECT count(*) as total FROM admin_users t `;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}

exports.search = async (offset, pageSize, key) => {
    const query = `SELECT t.id, t.email_id, t.password, t.user_location, t.role, t.city_wise, t.full_name, t.sort_name, t.show_appts_of, t.extra_sign FROM admin_users as t WHERE  LOWER(t.id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.email_id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.password) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.user_location) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.role) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.city_wise) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.full_name) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.sort_name) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.show_appts_of) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.extra_sign) LIKE `+SqlString.escape('%'+key+'%')+` LIMIT ?,?`;
    return getRows(query,[offset, pageSize]);
}

exports.searchCount = async (key) => {
    const query = `SELECT count(*) as total FROM admin_users t  WHERE  LOWER(t.id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.email_id) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.password) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.user_location) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.role) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.city_wise) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.full_name) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.sort_name) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.show_appts_of) LIKE `+SqlString.escape('%'+key+'%')+` OR  LOWER(t.extra_sign) LIKE `+SqlString.escape('%'+key+'%')+``;
    const result = await getRows(query);
    if (result && result[0] && result[0].total && result[0].total > 0) {
        return result[0].total;
    } else {
        return 0;
    }
}

exports.findOneByEmail = async (email) => {
    const query = `SELECT t.id, t.email_id, t.password, t.user_location, t.role, t.city_wise, t.full_name, t.sort_name, t.show_appts_of, t.extra_sign FROM admin_users as t WHERE t.email_id = ?`;
    return getRows(query, [email]);
}

exports.updatePasswordByEmail = async (email, hashedPassword) => {
    const query = `UPDATE admin_users SET password = ? WHERE email_id = ?`;
    const result = await updateRow(query, [hashedPassword, email]);
    return result; // Return the result of the update operation
}

exports.findOneAdminUser = async (userId) => {
    const query = `SELECT * FROM admin_users WHERE id = ?`;
    return getRows(query, [userId]);
};

exports.updateAdminUserPassword = async (email, hashedPassword) => {
    const query = `UPDATE admin_users SET password = ? WHERE email_id = ?`;
    const result = await updateRow(query, [hashedPassword, email]);
    return result; // Return the result of the update operation
};


