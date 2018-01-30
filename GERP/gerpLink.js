const sql = require('mssql');
const dbConfig = require('../dbConfig_test');
const insertByData = require('../sql/insertByData');

async function isIncidentAllmostWhere(IncidentNumber) {
    let pool = await new sql.ConnectionPool(dbConfig).connect();
    let result1 = await pool.request()
        .input('IncidentNumber', sql.NVarChar, IncidentNumber)
        .query(`
                    select ID, GerpNumber from tbl_IncidentGerp where IncidentNumber = @IncidentNumber
            `)
    sql.close();
    let linked_id = result1.recordset.length ? result1.recordset[0].ID : 0;
    let ticket_id = result1.recordset.length ? result1.recordset[0].GerpNumber : 0;

    if (linked_id) {
        if (ticket_id) {
            return true;
        } else {
            return ({
                error: true,
                Message: 'empty ticket_id',
                Code: -7,
                method: 'update'
            })
        }
    }
    return { error: false, method: 'insert'}
}

async function addGerpIncidentLink(data) {
    try {
        if (!data.method) return false;

        var link_methods = {
            insert: async (data) => {
                return await insertGerpLink(data);
            },
            update: async (data) => {
                return await updateGerpLink(data);
            }
        }
        return link_methods[data.method](data);
    } catch (e) {
        e.message = e.message + ' (error in addGerpIncidentLink)';
        throw e;        
    }
}

async function insertGerpLink(data) {
    let pool = await new sql.ConnectionPool(dbConfig).connect();
    data.ID = await insertByData(pool, 'tbl_IncidentGerp', data);
    sql.close();
    return data.ID
};

async function updateGerpLink(data) {
    let pool = await new sql.ConnectionPool(dbConfig).connect();
    let result1 = await pool.request()
        .input('IncidentNumber', sql.NVarChar, data.IncidentNumber)
        .input('GerpNumber', sql.NVarChar, data.GerpNumber)      
        .query(`
            update tbl_IncidentGerp set GerpNumber = @GerpNumber where IncidentNumber = @IncidentNumber
        `)
    sql.close();
    return result1.rowsAffected.length ? 1 : 0
}

module.exports = {
    isIncidentAllmostWhere: isIncidentAllmostWhere,
    addGerpIncidentLink: addGerpIncidentLink,
    updateGerpLink: updateGerpLink  
}