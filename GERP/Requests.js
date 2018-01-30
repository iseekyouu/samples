const login = 'terrasoft';
const password = 'terrasoft'; 
const createXml = require('./createXml');

module.exports = function (data, reject) {
    /// родитель запроса
    let Request = {
        tags: createTagsPool(),
        ns: 'm',
        baseUrl: 'cutted',
        createXml: function () {
            return createXml(this.url, this.ns, this.method, this.tags);
        },
        getUrl: function () {
            return this.url;
        },
        response: function (oXml) {
            /**
             * функция рабора ответа
             * @param {String} oXml, xml для парсинга
             * @throws {err} Пустой ответ
             * @throws {err} Ошибка разбора response GERPSiberia
             * @returns {object} response
            */
            try {
                if (oXml == "") throw { message: 'Пустой ответ' };

                function findTag(xml, tag, endtag) {
                    let s1 = xml.indexOf(tag);
                    let s2 = xml.indexOf(endtag);
                    if ((s1 < 0) || (s2 < 0)) return "";

                    return xml.slice(s1 + tag.length, s2);
                };

                var response = {
                    Code: findTag(oXml, '<code>', '</code>'),
                    Message: findTag(oXml, '<message>', '</message>'),
                    Ticket_Id: findTag(oXml, '<ticket_id>', '</ticket_id>')
                };
            } catch (e) {
                //Log.WriteToSystemLog(lmtError, e.name, e.message, 'Ошибка разбора response GERPSiberia', false);
                //return { error: e, Code: -100, Message: e.message };
                e.code = -100;
                e.myMessage = 'GERPSiberia response parse error';
                return reject(e)
            }

            return response;
        }
    };

    /// конструктор обработки подключения
    function Connect() {
        var self = this;
        self.url = self.baseUrl + '/soap/connections.php';
        this.create = function () {
            self.method = 'createConnectionTicket';
            return self;
        };
        this.update = function () {
            self.method = 'updateConnectionTicket';
            return self;
        };
        this.cancel = function () {
            self.method = 'cancelConnectionTicket';
            self.tags = createTagsPool('login, password, lsnum, comment');
            return self;
        };
        this.appendComment = function () {
            self.method = 'appendComment';
            self.tags = createTagsPool('login, password, lsnum, ticket_id, start_date, end_date, message');
            return self;
        };
    };
    Connect.prototype = Request;

    /// Конструктор скорой компьютерной помощи                            
    function FCH_Ticket() {
        var self = this;
        self.url = self.baseUrl + '/soap/atickets.php';

        this.create = function () {
            self.method = 'createTicket';
            return self;
        };
        this.update = function () {
            self.method = 'updateTicket';
            return self;
        };
        this.cancel = function () {
            self.method = 'cancelTicket';
            self.tags = createTagsPool('login, password, lsnum, comment');
            return self;
        };
    };
    FCH_Ticket.prototype = Request;

    /// Конструктор Trouble Ticket                            
    function TT_Ticket() {
        var self = this;
        self.url = self.baseUrl + '/soap/accidents.php';

        this.create = function () {
            self.method = 'createAccidentTicket';
            self.tags = createTagsPool('login, password, addr_gor, addr_ul,'
                + ' addr_dom, addr_pod, addr_etazh, addr_kv, domofon, client_type,'
                + ' org_name, fio, phone, comment, lsnum, req_type, start_date,'
                + ' end_date, istest, task_type_id, operator_agreement')
            return self;
        };
        this.update = function () {
            self.method = 'updateAccidentTicket';
            return self;
        };
        this.cancel = function () {
            self.method = 'cancelAccidentTicket';
            self.tags = createTagsPool('login, password, lsnum, comment');
            return self;
        };
        this.appendComment = function () {
            self.method = 'appendComment';
            self.tags = createTagsPool('login, password, lsnum, ticket_id, start_date, end_date, message');
            return self;
        };
    };
    TT_Ticket.prototype = Request;

    function createTagsPool(tags) {
        var tagPool = [{
            name: 'login',
            value: login
        }, {
                name: 'password',
                value: password
            }, {
                name: 'addr_gor',
                value: (data.City || "")
            }, {
                name: 'addr_ul',
                value: (data.Street || "")
            }, {
                name: 'addr_dom',
                value: (data.HouseNum || "")
            }, {
                name: 'addr_pod',
                value: (data.Porch || "")
            }, {
                name: 'addr_etazh',
                value: (data.Floor || "")
            }, {
                name: 'addr_kv',
                value: (data.Flat || "")
            }, {
                name: 'domofon',
                value: (data.Intercom || "")
            }, {
                name: 'client_type',
                value: (data.ClientType || "")
            }, {
                name: 'org_name',
                value: (data.OrgName || "")
            }, {
                name: 'fio',
                value: (data.FullName || "")
            }, {
                name: 'phone',
                value: (data.Phone || "")
            }, {
                name: 'comment',
                value: (data.Comment || "")
            }, {
                name: 'lsnum',
                value: (data.IncidentNumber || "")
            }, {
                name: 'req_type',
                value: (data.Req_type || "")
            }, {
                name: 'istest',
                value: 0
            }, {
                name: 'external_id',
                value: (data.IncidentNumber || "")
            }, {
                name: 'ticket_id',
                value: (data.TicketId || "")
            }, {
                name: 'start_date',
                value: (data.Start_date || "")
            }, {
                name: 'end_date',
                value: (data.End_date || "")
            }, {
                name: 'message',
                value: (data.Comment || "")
            }, {
                name: 'task_type_id',
                value: (data.Task_type_id || "")
            }, {
                name: 'address_code',
                value: (data.KLADR || "")
            }, {
                name: 'operator_agreement',
                value: (data.ServiceAgreementNumber || "")
            }

        ];

        if (tags) {
            var cuttedTagPool = [];
            tagPool.forEach( function (el, i) {
                tags.indexOf(el.name) >= 0 ? cuttedTagPool.push(el) : 1
            })
            return cuttedTagPool;
        }
        return tagPool
    }

    return {
        Connect: Connect,
        TT_Ticket: TT_Ticket
    }
}