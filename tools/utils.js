


exports.extend = function(obj, obj1){
    var key;
    for(key in obj1){
        obj[key] = obj1[key];
    }
    return obj;
};
