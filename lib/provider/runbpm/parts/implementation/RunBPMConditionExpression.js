'use strict';

var domQuery = require('min-dom/lib/query'),

    utils = require('../../../../Utils');


function getScriptType(node) {
  return utils.selectedType('select[name=scriptType]', node.parentElement);
}


module.exports = function(typePropName, scriptValuePropName) {

return {
  template:
   
    '<div class="pp-row">' +
      '<label for="cam-script-type">高级类型</label>' +
      '<div class="pp-field-wrapper">' +
        '<select id="cam-script-type" name="scriptType" data-value>' +
          '<option value="handler_bean_class" selected>类路径</option>' +
          '<option value="handler_bean_id">Spring Bean</option>' +
          '<option value="handler_bean_class_variable">动态类路径</option>' +
          '<option value="handler_bean_id_variable">动态Spring Bean</option>' +
        '</select>' +
      '</div>' +
    '</div>' +

    '<div class="pp-row">' +
      
      '<div class="pp-field-wrapper" >' +
        '<textarea id="cam-script-val" type="text" name="scriptValue"></textarea>' +
      '</div>'+
    '</div>',


    get: function (element, bo) {
      
      var values = {};
      // read values from xml:
      
      var  scriptValue = bo.get(scriptValuePropName),
          scriptType = bo.get(typePropName);

      values.scriptValue = scriptValue;
      values.scriptType = scriptType;
      

      return values;
    },

    set: function(element, values, containerElement) {
      
      var scriptType = values.scriptType,
          scriptValue = values.scriptValue;

      // init update
      var update = {};
      update[typePropName] = scriptType || 'handler_bean_class';
      update[scriptValuePropName] = scriptValue || '';

      return update;
    },

    validate: function(element, values) {
      var validationResult = {};

      if (!values.scriptValue) {
        validationResult.scriptValue = "Must provide a value";
      }

      return validationResult;
    },

    clearScript: function(element, inputNode, btnNode, scopeNode) {
      domQuery('textarea[name=scriptValue]', scopeNode).value='';

      return true;
    },

    canClearScript: function(element, inputNode, btnNode, scopeNode) {
      var input = domQuery('textarea[name=scriptValue]', scopeNode);

      return input.value !== '';
    },


  };

};
