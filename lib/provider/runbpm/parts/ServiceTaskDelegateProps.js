'use strict';

var is = require('bpmn-js/lib/util/ModelUtil').is,
    getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;

var ImplementationTypeHelper = require('../../../helper/ImplementationTypeHelper'),
    cmdHelper = require('../../../helper/CmdHelper'),
    InputOutputHelper        = require('../../../helper/InputOutputHelper');

var implementationType = require('./implementation/ImplementationType'),
    delegate           = require('./implementation/Delegate'),
    external           = require('./implementation/External'),
    callable           = require('./implementation/Callable'),
    resultVariable     = require('./implementation/ResultVariable');

var entryFactory = require('../../../factory/EntryFactory');

var domQuery   = require('min-dom/lib/query'),
    domClosest = require('min-dom/lib/closest'),
    domClasses = require('min-dom/lib/classes');

var script = require('./implementation/RunBPMConditionExpression')('runbpm:advancedType', 'value');

module.exports = function(group, element, bpmnFactory) {
  
  //todo
  var bo;
  if (!is(element, 'runbpm::ServiceTaskLike')) {
    return;
  }
  bo = getBusinessObject(element);

  group.entries.push({
    id: 'serviceTask',
    description: 'Implementation for a Script.',
    label: '',
    html: script.template,

    get: function (element) {
      return script.get(element, bo);
    },

    set: function(element, values, containerElement) {
      var properties = script.set(element, values, containerElement);

      return cmdHelper.updateProperties(element, properties);
    },

    validate: function(element, values) {
      return script.validate(element, values);
    }

  });

  
};
