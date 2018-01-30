/**
    * Создание объекта запроса, в зависимости от поданного названия метода
    * @param {String} sendType, название метода
    * @throws {object} метод отправки не распознан
    * @throws {object} не верный тип метода отправки
    * @returns {object} функция с нужным типом объекта запроса
*/
module.exports = (Request, sendType) => {
    if (typeof sendType == 'string') {
        var allowedMethods = {
            createConnectionTicket: function () { return new Request.Connect().create() },
            updateConnectionTicket: function () { return new Request.Connect().update() },
            cancelConnectionTicket: function () { return new Request.Connect().cancel() },
            appendComment: function () { return new Request.Connect().appendComment() },
            createTicket: function () { return new Request.FCH_Ticket().create() },
            updateTicket: function () { return new Request.FCH_Ticket().update() },
            cancelTicket: function () { return new Request.FCH_Ticket().cancel() },
            createAccidentTicket: function () { return new Request.TT_Ticket().create() },
            updateAccidentTicket: function () { return new Request.TT_Ticket().update() },
            cancelAccidentTicket: function () { return new Request.TT_Ticket().cancel() },
            appendCommentAccidentTicket: function () { return new Request.TT_Ticket().appendComment() }
        }
        if (sendType in allowedMethods) {
            return allowedMethods[sendType]();
        } else throw { code: -203, message: 'метод отправки не распознан' };
    } else throw { code: -204, message: 'не верный тип метода отправки' }
}