'use strict';

var getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject,
    is = require('bpmn-js/lib/util/ModelUtil').is;

var entryFactory = require('../../../factory/EntryFactory');

var callable = require('./implementation/Callable');

var cmdHelper = require('../../../helper/CmdHelper');

var flattenDeep = require('lodash/array/flattenDeep');
var assign = require('lodash/object/assign');

function getCallableType(element) {
  var bo = getBusinessObject(element);

  var boCalledElement = bo.get('calledElement'),
      boCaseRef = bo.get('runbpm:caseRef');

  var callActivityType = '';
  if (typeof boCalledElement !== 'undefined') {
    callActivityType = 'bpmn';
  } else

  if (typeof boCaseRef !== 'undefined') {
    callActivityType = 'cmmn';
  }

  return callActivityType;
}

var DEFAULT_PROPS = {
  calledElement: undefined,
  'runbpm:calledElementBinding': 'latest',
  'runbpm:calledElementVersion': undefined,
  'runbpm:caseRef': undefined,
  'runbpm:caseBinding': 'latest',
  'runbpm:caseVersion': undefined
};

module.exports = function(group, element, bpmnFactory) {

  if (!is(element, 'runbpm:CallActivity')) {
    return;
  }

  group.entries.push(entryFactory.selectBox({
    id : 'callActivity',
    label: 'CallActivity Type',
    selectOptions: [ { name: 'BPMN', value: 'bpmn' }, { name: 'CMMN', value: 'cmmn' } ],
    emptyParameter: true,
    modelProperty: 'callActivityType',

    get: function(element, node) {
      return {
        callActivityType: getCallableType(element)
      };
    },

    set: function(element, values, node) {
      var type = values.callActivityType;

      var props = assign({}, DEFAULT_PROPS);

      if (type === 'bpmn') {
        props.calledElement = '';
      }
      else if (type === 'cmmn') {
        props['runbpm:caseRef'] = '';
      }

      return cmdHelper.updateProperties(element, props);
    }

  }));

  group.entries.push(callable(element, bpmnFactory, {
    getCallableType: getCallableType
  }));

  group.entries = flattenDeep(group.entries);
};
