function isEmpty(str) {
    return (!str || 0 === str.length);
}

function isArray(o) {
    if (o == undefined) return false;
    return Object.prototype.toString.call(o) === '[object Array]';
}

function isFunction(functionToCheck) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

function setValues(obj, key, value) {
    return setValuesHelper(obj, key, value);
}

function setValuesHelper(obj, key, value) {
    if (!obj) return;
    if (obj instanceof Array) {
        for (var i in obj) {
            setValuesHelper(obj[i], key, value);
        }
        return;
    }

    if (obj[key]) obj[key] = value;

    if ((typeof obj == "object") && (obj !== null)) {
        var children = Object.keys(obj);
        if (children.length > 0) {
            for (i = 0; i < children.length; i++) {
                setValuesHelper(obj[children[i]], key, value);
            }
        }
    }
}

function findValues(obj, key) {
    return findValuesHelper(obj, key, []);
}

function findValuesHelper(obj, key, list) {
    if (!obj) return list;
    if (obj instanceof Array) {
        for (var i in obj) {
            list = list.concat(findValuesHelper(obj[i], key, []));
        }
        return list;
    }
    if (obj[key]) list.push(obj[key]);

    if ((typeof obj == "object") && (obj !== null)) {
        var children = Object.keys(obj);
        if (children.length > 0) {
            for (i = 0; i < children.length; i++) {
                list = list.concat(findValuesHelper(obj[children[i]], key, []));
            }
        }
    }
    return list;
}

//if the value does not exist return empty string
//trim the white spaces from the value. trim
function cleanValue(val) {
	switch (typeof val) {
	case "string":
		return val.trim();
	case "boolean":
	case "number":
		return val;
	default:
		return "";
	}
}
