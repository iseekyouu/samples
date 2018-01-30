//-----------------------------------------------------------------------------
// scr_GERPSiberia
// GERP - Название сервиса горсвязи
//-----------------------------------------------------------------------------
const xmlhttprequest = require("xmlhttprequest").XMLHttpRequest;
const GerpLog = require('./GerpLog');
const GerpLink = require('./gerpLink');

module.exports = function GERP(data, success, reject) {
    var oXmlHttp = new xmlhttprequest
    var login = 'cutted';
    var password = 'cutted';

    this.getData = () => {
        return data;
    };

    this.methods = {
        Connect: {
            create: 'createConnectionTicket',
            update: 'updateConnectionTicket',
            appendComment: 'appendComment',
            cancel: 'cancelConnectionTicket'
        },
        TT_Ticket: {
            create: 'createAccidentTicket',
            update: 'updateAccidentTicket',
            appendComment: 'appendCommentAccidentTicket',
            cancel: 'cancelAccidentTicket'
        }
    };

    let Request = require('./Requests')(data, sendReject);

    /// унифицированное создание запроса
    const createXml = require('./createXml');

    /**
     * отправка запроса с логированием
     * @param {object} request, {type: 'Connect', method: 'create'}
     */
    this.sendXmlWithLog = async function (request) {
        /**
         * data.sendMethodName, request.sendMethodName - конечные методы отправки
         * request.method - промежуточный метод отправки, обобщенный
        */
        if (!data.sendMethodName) {
            data.sendMethodName = request.sendMethodName ?
                request.sendMethodName : this.methods[data.RequestType][request.method];
        }

        try {
            if (!data.sendMethodName) throw new Error('Cant find sendMethodName');

            var response = await this.sendXml(this, sendSuccess, sendReject);
        }
        catch (e) {
            sendReject({ code: -201, message: 'Error in sendXmlWithLog: ' + e });
        }
        if (typeof response == 'object') return response;
        return true;
    };
    
    /// функция отправки запроса
    this.sendXml = async function (GERP, callback, reject) {
        try {
            if (!data.sendMethodName) throw { code: -202, message: 'Cant find sendMethodName' };

            /// создание объекта отправки
            var sendObject = require('./chooseSendObject')(Request, data.sendMethodName);

            /// запись в лог
            /// в случае повторной отправки (reSend) data.log_id не будет пустой
            data.RequestName = sendObject.method;
            if (!data.log_id) {
                data.log_id = await this.addLog();
            } else {
                await this.updateLog();
            }

            oXmlHttp.open("POST", sendObject.getUrl(), true);
            oXmlHttp.onreadystatechange = function () {
                if (oXmlHttp.readyState != 4) return
                if (oXmlHttp.status == 200) {
                    let xml = oXmlHttp.responseXML ? oXmlHttp.responseXML : oXmlHttp.responseText;
                    let response = sendObject.response(xml);

                    if (response.Code == "") {
                        reject({ code: -200, message: 'Empty Code! ', myMessage: GERP.getData().log_id })
                    } else {
                        callback(GERP, response, reject);
                    }
                } else {
                    reject({ code: -200, message: 'Send Error:' + oXmlHttp.statusText })
                }
            }
            var XML = sendObject.createXml()
            oXmlHttp.send(XML);

            return true
        } catch (e) {
            reject(e);
        }
    };

    /**
     * CallBack успешного ответа
     * @param GERP
     * @param response
     * @param reject
     */
    async function sendSuccess(GERP, response, reject) {
        var response_log_id = await GERP.addResponseLog(response);
        
        /// после успешного ответа, создадим связь, если есть ID тикета
        try {

            /// линк при успешном ответе
            if ((response.Code == 0) && (response.Ticket_Id)) {
                var res = await GerpLink.isIncidentAllmostWhere(data.IncidentNumber);
                if (res != true) {
                    var link_res = await GerpLink.addGerpIncidentLink({
                        method: res.method,
                        IncidentNumber: data.IncidentNumber,
                        GerpNumber: response.Ticket_Id,
                        TicketType: data.RequestType
                    });
                }
            }

            /// если был вызван create и вернулся код 70, то надо отправить повторно с update		
            if (response.Code == 70) {
                data.sendMethodName = '';
                data.log_id = '';
                data.GERPLogId = '';
                await GERP.sendXmlWithLog({ type: data.RequestType, method: 'update'});
            }

            if (response.Code != 70)
                return success('good send!');
        } catch (e) {
            e.myMessage = 'Error in sendSuccess';
            reject(e);
        }
        
    };

    /**
     * callback не успешного ответа
     * @param error
     */
    function sendReject(error) {
        /*Log.WriteToSystemLog(lmtError, error.Code, 'sendReject', 'Ошибка отправки в GERP, IncidentNumber: '
            + data.IncidentNumber + '; ' + error.Message, false);
        */
        error.myMessage ? error.message = [error.message, error.myMessage].join('; ') : error.message
        reject(error);
    };

    /// асинхронная функция добавления записи в основной лог
    this.addLog = function () {
        return GerpLog.addLog(data, sendReject);
    };
    /// асинхронная функция обновления записи в основной лог
    this.updateLog = function () {
        return GerpLog.updateLog(data, sendReject);
    };
    /// функция добавления записи в лог ответа, вызывается в асинхроне
    this.addResponseLog = function (response_data) {
        response_data.GERPLogId = data.log_id;
        return GerpLog.addResponseLog(response_data, sendReject);
    };
}       
