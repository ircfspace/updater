const protocols = ["vless", "vmess", "trojan"];
const ports = ["443", "2053", "2083", "2087", "2096", "8443"];

$(document).on('keyup', '#defConfig', function(e) {
    e.preventDefault();
    $('#protocolAlert, #portAlert, #result').addClass('none');
    let config = $(this).val().trim();
    if ( config === '' ) {
        console.clear();
        return false;
    }
    let protocol = getProtocol(config);
    if ( ! protocols.includes(protocol) ) {
        $('#protocolAlert').removeClass('none');
        return false;
    }
    if ( ! ports.includes(getAddress(config)[1]) ) {
        $('#portAlert').removeClass('none');
        return false;
    }
    let defConfig = parser(protocol, config);
    let newConfig = update(defConfig);
    let result = generate(newConfig);
    if ( result[0] !== '' ) {
        $('#result').removeClass('none');
        $('#result img').attr('src', result[1]);
        $('#result textarea').val(result[0]);
    }
});

$(document).on('change', '#options', function(e) {
    e.preventDefault();
    let option = $(this).val();
    if ( option === 'other' ) {
        $('#cleanIp').removeClass('none');
    }
    else {
        $('#cleanIp').addClass('none');
    }
    $('#defConfig').trigger('keyup');
});

$(document).on('keyup', '#cleanIp', function(e) {
    e.preventDefault();
    if ( !isValidIp( $(this).val() ) ) {
        return false;
    }
    $('#defConfig').trigger('keyup');
});

$(document).on('change', 'input[type="radio"][name="update"]', function(e) {
    e.preventDefault();
    $('#defConfig').trigger('keyup');
});

function parser(protocol, config) {
    if ( protocol === 'vmess' ) {
        config = base64Decode(config);
        config = Object.assign({
            'protocol': protocol,
        }, (config));
    }
    else if ( protocol === 'vless' || protocol === 'trojan' ) {
        config = Object.assign({
            'protocol': protocol,
            'id': getHashId(config),
            'address': getAddress(config)[0],
            'port': getAddress(config)[1],
        }, parseQuery(config));
    }
    /*else if ( protocol === 'ss' ) {
        config = {
            'protocol': protocol,
            'id': getHashId(config),
            'address': getAddress(config)[0],
            'port': getAddress(config)[1],
            'remark': getRemark(config),
        };
    }*/
    return config;
}

function update(config) {
    let cleanIp = getCleanIp();
    if ( cleanIp === '' ) {
        return false;
    }
    let fullEdit = document.getElementById('fullEdit').checked;
    if ( config.protocol === 'vmess' ) {
        if ( fullEdit ) {
            config.host = config.add;
            config.sni = config.add;
        }
        else {
            if ( typeof config.host === 'undefined' ) {
                config.host = config.add;
            }
        }
        config.add = cleanIp;
    }
    else if ( config.protocol === 'vless' || config.protocol === 'trojan' ) {
        if ( fullEdit ) {
            config.host = config.address;
            config.sni = config.address;
        }
        else {
            if ( typeof config.host === 'undefined' ) {
                config.host = config.address;
            }
        }
        config.address = cleanIp;
    }
    /*else if ( config.protocol === 'ss' ) {

    }*/
    return config;
}

function getProtocol(config) {
    let string = config.split("://");
    if ( typeof string[0] !== 'undefined' ) {
        return string[0];
    }
    return '';
}

function getHashId(config) {
    let string = config.split("@");
    if ( typeof string[0] !== 'undefined' ) {
        let protocol = getProtocol(config);
        return string[0].replace(protocol+"://", "");
    }
    return '';
}

function getAddress(config) {
    let protocol = getProtocol(config);
    if ( protocol === 'vmess' ) {
        config = base64Decode(config);
        return [
            config.add,
            String(config.port),
        ]
    }
    else {
        let string = config.split("@");
        if ( typeof string[1] !== 'undefined' ) {
            string = string[1].split("?");
            if ( typeof string[0] !== 'undefined' ) {
                string = string[0].split(":");
                if ( typeof string[0] !== 'undefined' && typeof string[1] !== 'undefined' ) {
                    return [
                        string[0],
                        string[1].split("#")[0],
                    ]
                }
            }
        }
    }
    return ['', ''];
}

function getRemark(config) {
    let string = config.split("#");
    if ( typeof string[1] !== 'undefined' ) {
        return decodeURIComponent(string[1]);
    }
}

function parseQuery(config) {
    let query = {};
    let protocol = getProtocol(config);
    if ( protocol === 'vmess' ) {
        query = base64Decode(config);
    }
    else {
        let string = config.split("?");
        if ( typeof string[1] !== 'undefined' ) {
            string = string[1].split("#");
            if ( typeof string[0] !== 'undefined' ) {
                let pairs = string[0].split('&');
                for (let i = 0; i < pairs.length; i++) {
                    let pair = pairs[i].split('=');
                    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
                }
                if ( typeof string[1] !== 'undefined' ) {
                    query['remark'] = decodeURIComponent(string[1]);
                }
            }
        }
    }
    return query;
}

function base64Decode(config) {
    try {
        config = config.replace("vmess://", "");
        return JSON.parse(atob(config));
    }
    catch {
        return {};
    }
}

function base64Encode(object) {
    try {
        delete object.protocol;
        return btoa(JSON.stringify(object));
    }
    catch {
        return "";
    }
}

function serializeQuery(object) {
    let str = [];
    for (let item in object) {
        if ( object.hasOwnProperty(item) ) {
            if ( item === "protocol" ) { continue; }
            if ( item === "id" ) { continue; }
            if ( item === "address" ) { continue; }
            if ( item === "port" ) { continue; }
            if ( item === "remark" ) { continue; }
            str.push(encodeURIComponent(item) + "=" + encodeURIComponent(object[item]));
        }
    }
    return str.join("&");
}

function generate(config) {
    let newConfig = '';
    if ( config.protocol === 'vless' || config.protocol === 'trojan' ) {
        newConfig += config.protocol+"://";
        newConfig += config.id+"@";
        newConfig += config.address+":"+config.port+"?";
        newConfig += serializeQuery(config);
        newConfig += "#"+config.remark;
    }
    else if ( config.protocol === 'vmess' ) {
        newConfig += config.protocol+"://";
        newConfig += base64Encode(config);
    }
    return [
        newConfig,
        "https://quickchart.io/qr?size=300x200&light=ffffff&text="+encodeURIComponent(newConfig)
    ];
}

function getCleanIp() {
    let value = $('#options').val();
    if ( value === 'other') {
        value = $('#cleanIp').val();
    }
    return value;
}

function isValidIp(string) {
    try {
        if (string === "" || string === undefined) {
            return false;
        }
        if (!/^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])(\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])){2}\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-4])$/.test(string)) {
            return false;
        }
        let ls = string.split('.')
        if (ls === null || ls.length !== 4 || ls[3] === "0" || parseInt(ls[3]) === 0) {
            return false
        }
        return true;
    }
    catch (e) { }
    return false;
}
