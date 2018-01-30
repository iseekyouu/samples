module.exports = function (url, ns, method, tags) {
    var XML = '<?xml version="1.0"?>'
        + '<soap:Envelope'
        + ' xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"'
        + ' soap:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"'
        + ' > '
        + '<soap:Body xmlns:' + ns + '="' + url + '">'
        + '<' + ns + ':' + method + '>'
        + function () {
            var text = '';
            tags.forEach(function (el, i) {
                text += '<' + el.name + '>' + el.value + '</' + el.name + '>'
            });
            return text;
        } ()
        + '</' + ns + ':' + method + '>'
        + '</soap:Body>'
        + '</soap:Envelope>'

    return XML;
};