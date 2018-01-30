const sql = require('mssql')
const dbConfig = require('../dbConfig');
const dateFormat = require('dateformat');
const insertByData = require('../sql/insertByData');

module.exports = {
    /**
     * функция записи в tbl_GerpLog
     * @param {object} data, информация для записи
        названия ключей должны совпадать с названиями столбцов таблицы
     * @param {function} sendReject, обработка ошибок
     * @returns {String} tbl_GerpLog ID
    */
    addLog: async (data, sendReject) => {
        data.TryCount = 1;

        try {
            let pool = await new sql.ConnectionPool(dbConfig).connect();
            data.ID = await insertByData(pool, 'tbl_GerpLog', data);  
            if (data.ID == 0) throw { message: 'Insert error'}      
            return data.ID;
        } catch (e) {
            e.code = -4;
            e.myMessage = 'Error, method: addLog , IncidentId ' + data.IncidentNumber;
            sendReject(e);
        } finally {
            sql.close();
        }
    },
    updateLog: async (data, sendReject) => {
        try {
            let now = dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss.l TT");
            let pool = await new sql.ConnectionPool(dbConfig).connect();
            let result1 = await pool.request()
                .input('ID', sql.UniqueIdentifier, data.log_id)
                .input('now', sql.NVarChar, now)
                .query(`update tbl_GERPLog set TryCount = ISNULL(TryCount, 0) + 1, ModifiedOn = @now  
					where Id  = @ID`)

            return data.ID;
        } catch (e) {
            e.code = -4;
            e.myMessage = 'Update GerpLog error, method: updateLog, IncidentId ' + data.IncidentNumber;
            sendReject(e);
        } finally {
            sql.close();
        }
    },
    /**
     * запись в лог ответа
     * @param {Object} response_data, объект с информацией об ответе
     * @param {function} sendReject, errorHandler
     * @returns {String} response_data.ID
     */
    addResponseLog: async (response_data, sendReject) => {
        try {
            let pool = await new sql.ConnectionPool(dbConfig).connect();

            response_data.ID = await insertByData(pool, 'tbl_GERPResponse', response_data);
            if (response_data.ID == 0) throw { message: 'Insert error' } 

            let result1 = await pool.request()
                .input('ResponseId', sql.UniqueIdentifier, response_data.ID)
                .input('Status', sql.NVarChar, !!response_data.ID ? 1 : 0)
                .input('LogId', sql.UniqueIdentifier, response_data.GERPLogId)
                .query(`
                    update tbl_GERPLog set ResponseId = @ResponseId, Status = @Status 
                    where ID = @LogId
            `) 

            return response_data.ID
        } catch (e) {
            console.dir(response_data);
            sendReject({
                Code: -6,
                myMessage: 'Error, method: addResponseLog, GerpLogID ' + response_data.GERPLogId,
                message: e.message,
                stack: e.stack
            });
        } finally {
            sql.close();
        }
    },
    getLastGerpLogByIncidentId: async (IncidentId, err) => {
        try {
            let pool = await new sql.ConnectionPool(dbConfig).connect();
            let result1 = await pool.request()
                .input('IncidentId', sql.UniqueIdentifier, IncidentId)
                .query(`
                    select top 1 * from tbl_GerpLog where IncidentId = @IncidentId
                    order by CreatedOn desc
            `)
            return result1
        } catch (e) {
            err(e);
        } finally {
            sql.close()
        }
    } 
}

