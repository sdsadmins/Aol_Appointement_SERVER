const {getRows} = require('../database/query');

exports.authLogin = async (username,password) => {
    const query = `SELECT  t.* FROM admin_users t  WHERE t.email_id=? AND t.password=? LIMIT 0,1`;
return getRows(query,[username,password]); 
}

