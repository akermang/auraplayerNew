/*** LOV handlers ***/
function prepare_S_CUSTOMER_ID_0_lov_request() {
    var inputParams = {};
    inputParams['MAIN_USERNAME_0'] = getFieldValue("MAIN_USERNAME_0");
    inputParams['MAIN_PASSWORD_0'] = getFieldValue("MAIN_PASSWORD_0");

    return inputParams;
}
function S_CUSTOMER_ID_0_lov_item_presenter(arrayItem, isUseLabelAsKeys) {
    var lovItems = [];
    lovItems.push(arrayItem[isUseLabelAsKeys ? "customerId" : "S_CUSTOMER_ID_0"]);
    lovItems.push(arrayItem[isUseLabelAsKeys ? "Name Required" : "S_CUSTOMER_NAME_0"]);

    return lovItems.join(",");
}
function S_CUSTOMER_ID_0_lov_item_handler(arrayItem, isUseLabelAsKeys) {
    populateField(isUseLabelAsKeys ? "customerId" : "S_CUSTOMER_ID_0", arrayItem[isUseLabelAsKeys ? "customerId" : "S_CUSTOMER_ID_0"]);
    populateField(isUseLabelAsKeys ? "Name Required" : "S_CUSTOMER_NAME_0", arrayItem[isUseLabelAsKeys ? "Name Required" : "S_CUSTOMER_NAME_0"]);
}
/*** End of LOV handlers ***/
/*** Parameter converters ***/
function convert_S_CUSTOMER_NAME_0(value) {
    return value;
}
function convert_S_CUSTOMER_ID_0(value) {
    return value;
}
function convert_S_CUSTOMER_PHONE_0(value) {
    return value;
}
function convert_S_CUSTOMER_COUNTRY_0(value) {
    return value;
}
function convert_S_CUSTOMER_ADDRESS_0(value) {
    return value;
}
function convert_S_CUSTOMER_CITY_0(value) {
    return value;
}
function convert_S_CUSTOMER_ZIP_CODE_0(value) {
    return {
        format : "dd-mm-yy",
        dateValue: value !== null ? (value !== '0' ? new Date(value) : new Date()) : null
    };
}
function convert_S_CUSTOMER_COMMENTS_0(value) {
    return value;
}
function convert_S_CUSTOMER_STATE_0(value) {
    return value === "true";
}
function convert_S_CUSTOMER_CREDIT_RATING_0(value) {
    return value;
}
function convert_map(value) {
	if (value !== undefined) {
		return value;
	}
    return getFieldValue('S_CUSTOMER_COUNTRY_0') + ' ' + getFieldValue('S_CUSTOMER_ADDRESS_0') + ' ' + getFieldValue('S_CUSTOMER_CITY_0') + ' ' + getFieldValue('S_CUSTOMER_STATE_0');
}
/*** End of parameter converters ***/
